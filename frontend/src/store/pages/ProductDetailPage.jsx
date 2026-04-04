import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ArrowLeft, Package, Truck, Shield, ChevronRight, Minus, Plus } from 'lucide-react';
import { storeApi } from '../../api/storeApi';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../components/ProductCard';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, cartLoading } = useStore();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const inWishlist = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    setLoading(true);
    setQty(1);
    setActiveImg(0);
    storeApi.getProduct(id)
      .then(p => {
        setProduct(p);
        document.title = `${p.name} – NovaBuy`;
        // Fetch related (same category)
        return storeApi.getProducts({ category: p.category, limit: 4 });
      })
      .then(data => setRelated(data.items.filter(p => p.id !== id).slice(0, 4)))
      .catch(() => navigate('/shop/products', { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080912] pt-24 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="bg-white/3 rounded-3xl aspect-square" />
          <div className="space-y-4">
            <div className="h-6 bg-white/3 rounded-lg w-1/3" />
            <div className="h-8 bg-white/3 rounded-lg w-3/4" />
            <div className="h-6 bg-white/3 rounded-lg w-1/4" />
            <div className="h-32 bg-white/3 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = [product.thumbnail, ...(product.images || []).filter(img => img !== product.thumbnail)];
  const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price);
  const formattedOriginal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.original_price);
  const savings = product.original_price - product.price;

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/shop" className="hover:text-violet-400 transition">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/shop/products" className="hover:text-violet-400 transition">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/shop/products?category=${product.category}`} className="hover:text-violet-400 transition capitalize">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-400 line-clamp-1">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white/3 rounded-3xl overflow-hidden border border-white/5">
              <img
                src={images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-violet-500' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-violet-400 font-semibold text-sm uppercase tracking-wide mb-2">{product.brand}</p>
              <h1 className="text-3xl font-bold text-white leading-tight">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={product.rating} />
              <span className="text-amber-400 font-semibold">{product.rating}</span>
              <span className="text-gray-500 text-sm">({product.review_count?.toLocaleString('en-IN')} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-white">{formattedPrice}</span>
              {product.discount_percent > 0 && (
                <>
                  <span className="text-xl text-gray-500 line-through">{formattedOriginal}</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-sm font-bold px-2 py-0.5 rounded-full">
                    {product.discount_percent}% OFF
                  </span>
                </>
              )}
            </div>
            {savings > 0 && (
              <p className="text-emerald-400 text-sm font-medium -mt-3">
                You save {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(savings)} 🎉
              </p>
            )}

            {/* Description */}
            <p className="text-gray-400 leading-relaxed text-sm border-t border-white/5 pt-4">
              {product.description}
            </p>

            {/* Quantity + CTA */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 py-3 text-white font-bold min-w-12 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => addToCart(product.id, qty, product.name)}
                disabled={product.stock === 0 || cartLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={() => toggleWishlist(product.id, product.name)}
                className={`p-3.5 rounded-xl border transition-all ${inWishlist ? 'border-pink-500/50 bg-pink-500/10 text-pink-500' : 'border-white/10 text-gray-400 hover:text-pink-400 hover:border-pink-500/30'}`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {/* Stock info */}
            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-amber-400 text-sm font-medium">
                ⚡ Only {product.stock} left in stock — order soon!
              </p>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-5">
              {[
                { icon: Truck, label: 'Free delivery over ₹499', color: 'text-emerald-400' },
                { icon: Shield, label: 'Secure & authentic', color: 'text-blue-400' },
                { icon: Package, label: '7-day easy returns', color: 'text-violet-400' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center text-center gap-2">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white mb-5">Specifications</h2>
            <div className="bg-[#111120] border border-white/5 rounded-2xl overflow-hidden">
              {Object.entries(product.specs).map(([key, val], i) => (
                <div key={key} className={`flex items-start gap-4 px-6 py-4 ${i % 2 === 0 ? 'bg-white/1' : ''}`}>
                  <p className="text-gray-500 text-sm w-40 shrink-0">{key}</p>
                  <p className="text-white text-sm font-medium">{val}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-16">
            {product.tags.map(tag => (
              <Link
                key={tag}
                to={`/shop/products?q=${tag}`}
                className="bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/30 text-gray-400 hover:text-violet-300 text-xs px-3 py-1.5 rounded-full transition"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
