import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, ShoppingBag, Star, TrendingUp, Shield, Truck, RefreshCw } from 'lucide-react';
import { storeApi } from '../../api/storeApi';
import ProductCard from '../components/ProductCard';

const CATEGORY_ICONS = {
  electronics: '⚡',
  clothing: '👕',
  books: '📚',
  home: '🏠',
  sports: '🏋️',
};

const CATEGORY_GRADIENTS = {
  electronics: 'from-violet-600/20 to-blue-600/20',
  clothing: 'from-pink-600/20 to-rose-600/20',
  books: 'from-amber-600/20 to-orange-600/20',
  home: 'from-emerald-600/20 to-teal-600/20',
  sports: 'from-cyan-600/20 to-sky-600/20',
};

const FEATURES = [
  { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹499', color: 'text-emerald-400' },
  { icon: Shield, title: 'Secure Shopping', desc: '100% safe & authentic', color: 'text-violet-400' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns', color: 'text-blue-400' },
  { icon: Star, title: 'Top Rated', desc: 'Only quality products', color: 'text-amber-400' },
];

export default function StoreHome() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'NovaBuy – Premium Shopping';
    Promise.all([
      storeApi.getFeatured(8),
      storeApi.getCategories(),
    ]).then(([feat, cats]) => {
      setFeatured(feat);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#080912]">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/8 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-fuchsia-600/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            New arrivals every week · Free delivery over ₹499
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Shop Everything.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Save More.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover premium products across electronics, clothing, books, home essentials and sports gear — all at the best prices.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/shop/products"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]"
            >
              Shop Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/shop/products?sort_by=rating"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all"
            >
              <TrendingUp className="w-5 h-5" /> Top Rated
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features strip ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-2xl px-4 py-4">
              <Icon className={`w-6 h-6 ${color} shrink-0`} />
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Shop by Category</h2>
          <Link to="/shop/products" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors flex items-center gap-1">
            All products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {(loading ? Array(5).fill(null) : categories).map((cat, i) => (
            cat ? (
              <Link
                key={cat.id}
                to={`/shop/products?category=${cat.id}`}
                className={`group relative bg-gradient-to-br ${CATEGORY_GRADIENTS[cat.id]} border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
              >
                <div className="text-4xl mb-3">{CATEGORY_ICONS[cat.id]}</div>
                <p className="text-white font-semibold text-sm">{cat.label}</p>
                <p className="text-gray-500 text-xs mt-1">{cat.product_count} products</p>
              </Link>
            ) : (
              <div key={i} className="bg-white/3 rounded-2xl h-32 animate-pulse" />
            )
          ))}
        </div>
      </section>

      {/* ─── Featured Products ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Products</h2>
            <p className="text-gray-500 text-sm mt-1">Handpicked selections for you</p>
          </div>
          <Link to="/shop/products" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="bg-white/3 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="relative bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border border-violet-500/20 rounded-3xl p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-fuchsia-600/5" />
          <div className="relative">
            <ShoppingBag className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to start shopping?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Explore 30+ curated products. Use promo code <span className="text-violet-300 font-mono font-semibold">WELCOME10</span> for 10% off your first order.
            </p>
            <Link
              to="/shop/products"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]"
            >
              Explore Products <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 py-8 text-center text-gray-600 text-sm">
        <p>© 2026 NovaBuy · All rights reserved · Powered by PhantomShield</p>
      </footer>
    </div>
  );
}
