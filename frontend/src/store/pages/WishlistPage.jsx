import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, cartLoading, wishlistLoading } = useStore();

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Wishlist</h1>
            <p className="text-gray-500 text-sm mt-0.5">{wishlist.item_count} saved item{wishlist.item_count !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {wishlist.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart className="w-16 h-16 text-gray-800 mb-5" />
            <h2 className="text-2xl font-bold text-gray-400 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save products you love to revisit them later</p>
            <Link to="/shop/products" className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-semibold transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlist.items.map(item => (
              <div
                key={item.wishlist_item_id}
                className="group bg-[#111120] border border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/20 transition-all hover:-translate-y-0.5"
              >
                <Link to={`/shop/products/${item.product_id}`} className="block aspect-video overflow-hidden">
                  <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>

                <div className="p-4 space-y-3">
                  <Link to={`/shop/products/${item.product_id}`}>
                    <h3 className="text-white font-semibold text-sm hover:text-violet-300 transition line-clamp-2">{item.name}</h3>
                  </Link>

                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-white">{fmt(item.price)}</span>
                    {item.original_price > item.price && (
                      <span className="text-sm text-gray-500 line-through">{fmt(item.original_price)}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(item.product_id, 1, item.name)}
                      disabled={cartLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(item.product_id, item.name)}
                      disabled={wishlistLoading}
                      className="p-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 border border-white/10 hover:border-red-500/20 rounded-xl transition-all disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
