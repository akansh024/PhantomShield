import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Heart, Minus, Package, Plus, Shield, ShoppingCart, Star, Truck } from 'lucide-react';

import { storeApi } from '../../api/storeApi';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../components/ProductCard';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((slot) => (
        <Star
          key={slot}
          className={`w-4 h-4 ${slot <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`}
        />
      ))}
    </div>
  );
}

const TRUST_BADGES = [
  { icon: Truck, label: 'Free delivery over INR 499', color: 'text-emerald-400' },
  { icon: Shield, label: 'Secure and authentic', color: 'text-blue-400' },
  { icon: Package, label: '7-day easy returns', color: 'text-violet-400' },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartLoading, isInWishlist, toggleWishlist } = useStore();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const loading = !product || product.id !== id;
  const inWishlist = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    let cancelled = false;

    storeApi.getProduct(id)
      .then((nextProduct) => {
        if (cancelled) return;
        setProduct(nextProduct);
        setQty(1);
        setActiveImg(0);
        document.title = `${nextProduct.name} - NovaBuy`;
        return storeApi.getProducts({ category: nextProduct.category, limit: 4 });
      })
      .then((data) => {
        if (cancelled || !data) return;
        setRelated(data.items.filter((item) => item.id !== id).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) navigate('/shop/products', { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080912] pt-24 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 animate-pulse" aria-busy="true">
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

  const images = [product.thumbnail, ...(product.images || []).filter((img) => img !== product.thumbnail)];
  const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price);
  const formattedOriginal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.original_price);
  const savings = product.original_price - product.price;

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link to="/shop" className="hover:text-violet-400 transition">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/shop/products" className="hover:text-violet-400 transition">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/shop/products?category=${product.category}`} className="hover:text-violet-400 transition capitalize">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-400 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-4">
            <div className="aspect-square bg-white/3 rounded-3xl overflow-hidden border border-white/5">
              <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, index) => (
                  <button
                    type="button"
                    key={img + index}
                    onClick={() => setActiveImg(index)}
                    aria-label={`View image ${index + 1} of ${images.length}`}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      index === activeImg ? 'border-violet-500' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-violet-400 font-semibold text-sm uppercase tracking-wide mb-2">{product.brand}</p>
              <h1 className="text-3xl font-bold text-white leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3">
              <StarRating rating={product.rating} />
              <span className="text-amber-400 font-semibold">{product.rating}</span>
              <span className="text-gray-500 text-sm">({product.review_count?.toLocaleString('en-IN')} reviews)</span>
            </div>

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
                You save {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(savings)}
              </p>
            )}

            <p className="text-gray-400 leading-relaxed text-sm border-t border-white/5 pt-4">
              {product.description}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  aria-label="Decrease quantity"
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 py-3 text-white font-bold min-w-12 text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((current) => Math.max(1, Math.min(product.stock || 1, current + 1)))}
                  aria-label="Increase quantity"
                  className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => addToCart(product.id, qty, product.name)}
                disabled={product.stock === 0 || cartLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id, product.name)}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={inWishlist}
                className={`p-3.5 rounded-xl border transition-all ${
                  inWishlist
                    ? 'border-pink-500/50 bg-pink-500/10 text-pink-500'
                    : 'border-white/10 text-gray-400 hover:text-pink-400 hover:border-pink-500/30'
                }`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-amber-400 text-sm font-medium">
                Only {product.stock} left in stock - order soon.
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-5">
              {TRUST_BADGES.map((badge) => (
                <div key={badge.label} className="flex flex-col items-center text-center gap-2">
                  <badge.icon className={`w-5 h-5 ${badge.color}`} />
                  <p className="text-xs text-gray-500">{badge.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {product.specs && Object.keys(product.specs).length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white mb-5">Specifications</h2>
            <div className="bg-[#111120] border border-white/5 rounded-2xl overflow-hidden">
              {Object.entries(product.specs).map(([key, value], index) => (
                <div key={key} className={`flex items-start gap-4 px-6 py-4 ${index % 2 === 0 ? 'bg-white/1' : ''}`}>
                  <p className="text-gray-500 text-sm w-40 shrink-0">{key}</p>
                  <p className="text-white text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-16">
            {product.tags.map((tag) => (
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

        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
