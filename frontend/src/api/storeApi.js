/**
 * PhantomShield Store – API Client
 *
 * All store requests go through /api/store/*.
 * The browser automatically sends the session_id HttpOnly cookie.
 * The frontend has NO knowledge of real vs decoy mode.
 */

const BASE = '/api/store';

async function request(method, path, body = null) {
  const opts = {
    method,
    credentials: 'include',           // send session_id cookie
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ─── Products ────────────────────────────────────────────────────────────────

export const storeApi = {
  // Products
  getCategories: () => request('GET', '/categories'),
  getFeatured: (limit = 8) => request('GET', `/products/featured?limit=${limit}`),
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
    ).toString();
    return request('GET', `/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request('GET', `/products/${id}`),

  // Cart
  getCart: () => request('GET', '/cart'),
  addToCart: (product_id, quantity = 1) => request('POST', '/cart/add', { product_id, quantity }),
  updateCartItem: (product_id, quantity) => request('PATCH', `/cart/item/${product_id}`, { quantity }),
  removeFromCart: (product_id) => request('DELETE', `/cart/item/${product_id}`),
  clearCart: () => request('DELETE', '/cart'),

  // Wishlist
  getWishlist: () => request('GET', '/wishlist'),
  addToWishlist: (product_id) => request('POST', '/wishlist/add', { product_id }),
  removeFromWishlist: (product_id) => request('DELETE', `/wishlist/${product_id}`),

  // Orders
  placeOrder: (body) => request('POST', '/orders', body),
  getOrders: () => request('GET', '/orders'),
  getOrder: (order_id) => request('GET', `/orders/${order_id}`),
};
