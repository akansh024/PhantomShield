import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Search, 
  Menu, 
  X, 
  ShoppingBag, 
  User, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

export default function StoreNavbar() {
  const { cart, wishlist } = useStore();
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop/products?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  const navLinks = [
    { to: '/shop', label: 'Home' },
    { to: '/shop/products', label: 'All Products' },
    { to: '/shop/products?category=electronics', label: 'Electronics' },
    { to: '/shop/products?category=clothing', label: 'Clothing' },
    { to: '/shop/products?category=books', label: 'Books' },
  ];

  const isActive = (to) => location.pathname + location.search === to;

  return (
    <>
      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-violet-400 w-5 h-5" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands, categories…"
                className="w-full pl-14 pr-16 py-5 bg-[#1a1b2e] border border-violet-500/30 rounded-2xl text-white text-lg placeholder:text-gray-500 focus:outline-none focus:border-violet-400"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0d0e1a]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/shop" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                NovaBuy
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-violet-600/20 text-violet-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                to="/shop/wishlist"
                className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${wishlist?.item_count > 0 ? 'fill-pink-500 text-pink-500' : ''}`} />
                {wishlist?.item_count > 0 && (
                  <span className="absolute top-1 right-1 bg-pink-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlist.item_count > 9 ? '9+' : wishlist.item_count}
                  </span>
                )}
              </Link>

              <Link
                to="/shop/cart"
                className="relative flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-xl transition-all font-medium text-sm"
                aria-label="Cart"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cart?.item_count > 0 && (
                  <span className="bg-white text-violet-700 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cart.item_count > 9 ? '9+' : cart.item_count}
                  </span>
                )}
              </Link>

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="relative ml-2">
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                      {user?.name?.[0].toUpperCase() || <User size={14} />}
                    </div>
                    <span className="hidden md:inline text-sm font-medium text-gray-200">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#11111a] border border-white/5 shadow-2xl overflow-hidden py-1">
                      <Link 
                        to="/shop/orders" 
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <ShoppingBag size={16} /> My Orders
                      </Link>
                      <button 
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1 ml-2">
                  <Link 
                    to="/shop/login" 
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-all"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/shop/signup" 
                    className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-all"
                aria-label="Menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="lg:hidden pb-4 border-t border-white/5 mt-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
