import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function CartItemRow({ item, onUpdate, onRemove, loading }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#111120] border border-white/5 rounded-2xl">
      <Link to={`/shop/products/${item.product_id}`} className="shrink-0">
        <img src={item.thumbnail} alt={item.name} className="w-20 h-20 rounded-xl object-cover border border-white/5 hover:border-violet-500/30 transition" />
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/shop/products/${item.product_id}`}>
          <h3 className="text-white font-medium hover:text-violet-300 transition line-clamp-2 text-sm">{item.name}</h3>
        </Link>
        <p className="text-gray-500 text-xs mt-1">Unit price: {fmt(item.price)}</p>

        <div className="flex items-center justify-between mt-3">
          {/* Quantity */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => item.quantity > 1 ? onUpdate(item.product_id, item.quantity - 1) : onRemove(item.product_id)}
              disabled={loading}
              aria-label={`Decrease quantity of ${item.name}`}
              className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-4 text-white font-bold text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(item.product_id, item.quantity + 1)}
              disabled={loading}
              aria-label={`Increase quantity of ${item.name}`}
              className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subtotal + remove */}
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">{fmt(item.subtotal)}</span>
            <button
              type="button"
              onClick={() => onRemove(item.product_id)}
              disabled={loading}
              className="text-gray-600 hover:text-red-400 transition disabled:opacity-50"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSummary({ cart }) {
  return (
    <div className="bg-[#111120] border border-white/5 rounded-2xl p-6 sticky top-20">
      <h2 className="text-lg font-bold text-white mb-5">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Subtotal ({cart.item_count} items)</span>
          <span>{fmt(cart.subtotal)}</span>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Discount</span>
            <span>–{fmt(cart.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-400">
          <span>Delivery</span>
          <span>{cart.delivery_fee > 0 ? fmt(cart.delivery_fee) : <span className="text-emerald-400 font-medium">FREE</span>}</span>
        </div>
        {cart.delivery_fee > 0 && (
          <p className="text-xs text-gray-600">Add {fmt(499 - cart.subtotal)} more for free delivery</p>
        )}
        <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-base">
          <span>Total</span>
          <span>{fmt(cart.total)}</span>
        </div>
      </div>

      <Link
        to="/shop/checkout"
        className="mt-6 block w-full text-center bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
      >
        Proceed to Checkout <ArrowRight className="w-4 h-4" />
      </Link>

      <Link
        to="/shop/products"
        className="mt-3 block w-full text-center text-gray-500 hover:text-white text-sm transition py-2"
      >
        ← Continue shopping
      </Link>
    </div>
  );
}

export default function CartPage() {
  const { cart, updateCartItem, removeFromCart, clearCart, cartLoading } = useStore();

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-violet-400" />
              Shopping Cart
            </h1>
            <p className="text-gray-500 text-sm mt-1">{cart.item_count} item{cart.item_count !== 1 ? 's' : ''}</p>
          </div>
          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-red-400 transition"
            >
              Clear all
            </button>
          )}
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-800 mb-5" />
            <h2 className="text-2xl font-bold text-gray-400 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started</p>
            <Link
              to="/shop/products"
              className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-semibold transition"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Items */}
            <div className="space-y-3">
              {cart.items.map(item => (
                <CartItemRow
                  key={item.cart_item_id}
                  item={item}
                  onUpdate={updateCartItem}
                  onRemove={removeFromCart}
                  loading={cartLoading}
                />
              ))}
            </div>

            {/* Summary */}
            <CartSummary cart={cart} />
          </div>
        )}
      </div>
    </div>
  );
}
