import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { storeApi } from '../api/storeApi';

/**
 * StoreContext – Global store state
 *
 * Manages: cart, wishlist, UI state (loading, errors)
 * Strategy: optimistic local updates → backend sync → rollback on error
 *
 * The frontend is mode-agnostic. It just calls storeApi and renders results.
 */

const StoreContext = createContext(null);

const initialState = {
  cart: { items: [], subtotal: 0, discount: 0, delivery_fee: 0, total: 0, item_count: 0 },
  wishlist: { items: [], item_count: 0 },
  wishlistIds: new Set(),   // fast lookup: O(1) contains check
  cartLoading: false,
  wishlistLoading: false,
  notification: null,       // { type: 'success'|'error', message }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, cart: action.payload, cartLoading: false };
    case 'SET_WISHLIST': {
      const ids = new Set(action.payload.items.map(i => i.product_id));
      return { ...state, wishlist: action.payload, wishlistIds: ids, wishlistLoading: false };
    }
    case 'SET_CART_LOADING':
      return { ...state, cartLoading: action.payload };
    case 'SET_WISHLIST_LOADING':
      return { ...state, wishlistLoading: action.payload };
    case 'NOTIFY':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFY':
      return { ...state, notification: null };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const notify = useCallback((type, message, duration = 3000) => {
    dispatch({ type: 'NOTIFY', payload: { type, message } });
    setTimeout(() => dispatch({ type: 'CLEAR_NOTIFY' }), duration);
  }, []);

  // ── Cart actions ─────────────────────────────────────────────────────────

  const refreshCart = useCallback(async () => {
    try {
      const cart = await storeApi.getCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (_) {}
  }, []);

  const addToCart = useCallback(async (product_id, quantity = 1, productName = '') => {
    dispatch({ type: 'SET_CART_LOADING', payload: true });
    try {
      const cart = await storeApi.addToCart(product_id, quantity);
      dispatch({ type: 'SET_CART', payload: cart });
      notify('success', productName ? `"${productName}" added to cart` : 'Added to cart');
    } catch (err) {
      dispatch({ type: 'SET_CART_LOADING', payload: false });
      notify('error', err.message || 'Could not add to cart');
    }
  }, [notify]);

  const updateCartItem = useCallback(async (product_id, quantity) => {
    dispatch({ type: 'SET_CART_LOADING', payload: true });
    try {
      const cart = await storeApi.updateCartItem(product_id, quantity);
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (err) {
      dispatch({ type: 'SET_CART_LOADING', payload: false });
      notify('error', err.message || 'Could not update cart');
    }
  }, [notify]);

  const removeFromCart = useCallback(async (product_id) => {
    dispatch({ type: 'SET_CART_LOADING', payload: true });
    try {
      const cart = await storeApi.removeFromCart(product_id);
      dispatch({ type: 'SET_CART', payload: cart });
      notify('success', 'Item removed from cart');
    } catch (err) {
      dispatch({ type: 'SET_CART_LOADING', payload: false });
      notify('error', err.message || 'Could not remove item');
    }
  }, [notify]);

  const clearCart = useCallback(async () => {
    try {
      const cart = await storeApi.clearCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (_) {}
  }, []);

  // ── Wishlist actions ──────────────────────────────────────────────────────

  const refreshWishlist = useCallback(async () => {
    try {
      const wishlist = await storeApi.getWishlist();
      dispatch({ type: 'SET_WISHLIST', payload: wishlist });
    } catch (_) {}
  }, []);

  const toggleWishlist = useCallback(async (product_id, productName = '') => {
    const isInWishlist = state.wishlistIds.has(product_id);
    dispatch({ type: 'SET_WISHLIST_LOADING', payload: true });
    try {
      let wishlist;
      if (isInWishlist) {
        wishlist = await storeApi.removeFromWishlist(product_id);
        notify('success', productName ? `"${productName}" removed from wishlist` : 'Removed from wishlist');
      } else {
        wishlist = await storeApi.addToWishlist(product_id);
        notify('success', productName ? `"${productName}" saved to wishlist` : 'Saved to wishlist');
      }
      dispatch({ type: 'SET_WISHLIST', payload: wishlist });
    } catch (err) {
      dispatch({ type: 'SET_WISHLIST_LOADING', payload: false });
      notify('error', err.message || 'Wishlist error');
    }
  }, [state.wishlistIds, notify]);

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  const value = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    toggleWishlist,
    refreshWishlist,
    notify,
    isInWishlist: (id) => state.wishlistIds.has(id),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
