import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

/**
 * ProductCard – The atomic unit of the store.
 * Used in grids, carousels, search results, and wishlist.
 */
export default function ProductCard({ product, compact = false }) {
  const { addToCart, toggleWishlist, isInWishlist, cartLoading } = useStore();
  const inWishlist = isInWishlist(product.id);

  const discount = product.discount_percent;
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedOriginal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.original_price);

  return (
    <article className="group relative bg-[#111120] border border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(139,92,246,0.12)] flex flex-col">
      {/* Wishlist button */}
      <button
        onClick={(e) => { e.preventDefault(); toggleWishlist(product.id, product.name); }}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all"
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-4 h-4 transition-colors ${inWishlist ? 'fill-pink-500 text-pink-500' : 'text-gray-400 hover:text-pink-400'}`} />
      </button>

      {/* Discount badge */}
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          -{discount}%
        </div>
      )}

      {/* Image */}
      <Link to={`/shop/products/${product.id}`} className="block overflow-hidden aspect-square bg-white/3">
        <img
          src={product.thumbnail}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-xs text-violet-400 font-medium uppercase tracking-wide">{product.brand}</p>

        <Link to={`/shop/products/${product.id}`}>
          <h3 className={`text-white font-semibold hover:text-violet-300 transition-colors line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star
                key={s}
                className={`w-3 h-3 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.review_count?.toLocaleString('en-IN')})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-lg font-bold text-white">{formattedPrice}</span>
          {discount > 0 && (
            <span className="text-sm text-gray-500 line-through">{formattedOriginal}</span>
          )}
        </div>

        {/* Out of stock */}
        {product.stock === 0 && (
          <p className="text-xs text-red-400 font-medium">Out of stock</p>
        )}

        {/* Add to cart */}
        <button
          onClick={() => addToCart(product.id, 1, product.name)}
          disabled={product.stock === 0 || cartLoading}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-all active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
