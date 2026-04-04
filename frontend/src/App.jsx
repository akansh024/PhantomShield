import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Existing admin dashboard
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import SessionsList from './pages/SessionsList';

// Store pages
import StoreHome from './store/pages/StoreHome';
import ProductsPage from './store/pages/ProductsPage';
import ProductDetailPage from './store/pages/ProductDetailPage';
import CartPage from './store/pages/CartPage';
import WishlistPage from './store/pages/WishlistPage';
import CheckoutPage from './store/pages/CheckoutPage';
import OrderSuccessPage from './store/pages/OrderSuccessPage';
import OrdersPage from './store/pages/OrdersPage';
import OrderDetailPage from './store/pages/OrderDetailPage';

// Store layout + context
import StoreNavbar from './store/components/StoreNavbar';
import ToastNotification from './store/components/ToastNotification';
import { StoreProvider } from './context/StoreContext';

// Dashboard placeholders
const Forensics = () => <div className="p-8 text-center text-gray-500">Forensics Timeline (Coming soon)</div>;
const Settings  = () => <div className="p-8 text-center text-gray-500">System Settings (Coming soon)</div>;

import { AuthProvider } from './context/AuthContext';
import StoreLoginPage from './store/pages/StoreLoginPage';
import StoreSignupPage from './store/pages/StoreSignupPage';

// Store layout wrapper
function StoreLayout({ children }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <StoreNavbar />
        <ToastNotification />
        <div className="min-h-screen bg-[#050505] text-white">
          {children}
        </div>
      </StoreProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Admin / Marketing Routes ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="sessions" element={<SessionsList />} />
          <Route path="forensics" element={<Forensics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ── NovaBuy Store Routes ── */}
        <Route path="/shop" element={<StoreLayout><StoreHome /></StoreLayout>} />
        <Route path="/shop/products" element={<StoreLayout><ProductsPage /></StoreLayout>} />
        <Route path="/shop/products/:id" element={<StoreLayout><ProductDetailPage /></StoreLayout>} />
        <Route path="/shop/cart" element={<StoreLayout><CartPage /></StoreLayout>} />
        <Route path="/shop/wishlist" element={<StoreLayout><WishlistPage /></StoreLayout>} />
        <Route path="/shop/checkout" element={<StoreLayout><CheckoutPage /></StoreLayout>} />
        <Route path="/shop/order-success/:orderId" element={<StoreLayout><OrderSuccessPage /></StoreLayout>} />
        <Route path="/shop/orders" element={<StoreLayout><OrdersPage /></StoreLayout>} />
        <Route path="/shop/orders/:orderId" element={<StoreLayout><OrderDetailPage /></StoreLayout>} />
        <Route path="/shop/login" element={<StoreLayout><StoreLoginPage /></StoreLayout>} />
        <Route path="/shop/signup" element={<StoreLayout><StoreSignupPage /></StoreLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
