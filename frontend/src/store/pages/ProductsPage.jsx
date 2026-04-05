import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';

import { storeApi } from '../../api/storeApi';
import ProductCard from '../components/ProductCard';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest First' },
];

const CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'books', label: 'Books' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'sports', label: 'Sports & Fitness' },
];

function FilterSidebar({ filters, onChange, onReset }) {
  const hasActive = filters.category || filters.min_price || filters.max_price || filters.min_rating || filters.in_stock_only;

  return (
    <aside id="product-filters" className="w-full lg:w-64 shrink-0" aria-label="Product filters">
      <div className="bg-[#111120] border border-white/5 rounded-2xl p-5 sticky top-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-white font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-violet-400" />
            Filters
          </div>
          {hasActive && (
            <button type="button" onClick={onReset} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Category</p>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => onChange('category', cat.id || null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  filters.category === cat.id || (!filters.category && !cat.id)
                    ? 'bg-violet-600/20 text-violet-300 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Price Range (INR)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(event) => onChange('min_price', event.target.value ? Number(event.target.value) : null)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500"
            />
            <span className="text-gray-600">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(event) => onChange('max_price', event.target.value ? Number(event.target.value) : null)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Min Rating</p>
          <div className="flex gap-2">
            {[4, 4.5, null].map((ratingValue) => (
              <button
                type="button"
                key={String(ratingValue)}
                onClick={() => onChange('min_rating', ratingValue)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  filters.min_rating === ratingValue
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {ratingValue ? `${ratingValue}*+` : 'Any'}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.in_stock_only || false}
              onChange={(event) => onChange('in_stock_only', event.target.checked || null)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              filters.in_stock_only ? 'bg-violet-600 border-violet-600' : 'border-white/20 group-hover:border-violet-500'
            }`}>
              {filters.in_stock_only && <span className="text-white text-xs font-bold">✓</span>}
            </div>
          </div>
          <span className="text-sm text-gray-400 group-hover:text-white transition-colors">In stock only</span>
        </label>
      </div>
    </aside>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : null,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : null,
    min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : null,
    in_stock_only: searchParams.get('in_stock_only') === 'true' || false,
    sort_by: searchParams.get('sort_by') || 'relevance',
  };

  const LIMIT = 12;
  const totalPages = Math.ceil(total / LIMIT);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: LIMIT };
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === false) delete params[key];
      });
      const data = await storeApi.getProducts(params);
      setProducts(data.items);
      setTotal(data.total);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = 'Products - NovaBuy';
    fetchProducts();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [fetchProducts]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === false || value === '') next.delete(key);
    else next.set(key, String(value));
    setSearchParams(next);
    setPage(1);
    if (window.innerWidth < 1024) setShowFilters(false);
  };

  const resetFilters = () => {
    setSearchParams({});
    setPage(1);
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-[#080912] pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {filters.q
                ? `Results for "${filters.q}"`
                : filters.category
                  ? CATEGORIES.find((category) => category.id === filters.category)?.label
                  : 'All Products'}
            </h1>
            {!loading && (
              <p className="text-gray-500 text-sm mt-1" aria-live="polite">
                {total.toLocaleString('en-IN')} products found
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              aria-controls="product-filters"
              aria-expanded={showFilters}
              className="lg:hidden flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm text-gray-300"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            <div className="relative">
              <select
                value={filters.sort_by}
                onChange={(event) => updateFilter('sort_by', event.target.value)}
                className="appearance-none bg-white/5 border border-white/10 text-gray-300 pl-4 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#111120]">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {showFilters && (
            <button
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
          )}

          <div className={`${showFilters ? 'fixed inset-x-4 top-24 z-50' : 'hidden'} lg:static lg:z-auto lg:block`}>
            <FilterSidebar filters={filters} onChange={updateFilter} onReset={resetFilters} />
          </div>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5" aria-busy="true">
                {Array(LIMIT).fill(null).map((_, index) => (
                  <div key={index} className="bg-white/3 rounded-2xl h-80 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Search className="w-12 h-12 text-gray-700 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try different filters or search terms.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                      aria-label="Go to previous products page"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 disabled:opacity-40 hover:bg-white/10 transition text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-gray-500 text-sm px-4">Page {page} of {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                      aria-label="Go to next products page"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 disabled:opacity-40 hover:bg-white/10 transition text-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
