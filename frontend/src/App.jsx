import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import OpsAlertsPage from './ops/pages/OpsAlertsPage';
import OpsAnalyticsPage from './ops/pages/OpsAnalyticsPage';
import OpsForensicsPage from './ops/pages/OpsForensicsPage';
import OpsOverviewPage from './ops/pages/OpsOverviewPage';
import OpsSessionsPage from './ops/pages/OpsSessionsPage';
import OpsDashboardLayout from './ops/layout/OpsDashboardLayout';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import StoreNavbar from './store/components/StoreNavbar';
import ToastNotification from './store/components/ToastNotification';
import CartPage from './store/pages/CartPage';
import CheckoutPage from './store/pages/CheckoutPage';
import OrderDetailPage from './store/pages/OrderDetailPage';
import OrdersPage from './store/pages/OrdersPage';
import OrderSuccessPage from './store/pages/OrderSuccessPage';
import ProductDetailPage from './store/pages/ProductDetailPage';
import ProductsPage from './store/pages/ProductsPage';
import StoreHome from './store/pages/StoreHome';
import StoreLoginPage from './store/pages/StoreLoginPage';
import StoreSignupPage from './store/pages/StoreSignupPage';
import WishlistPage from './store/pages/WishlistPage';

function StoreShell() {
  return (
    <AuthProvider>
      <StoreProvider>
        <a href="#store-main" className="skip-link">Skip to main content</a>
        <StoreNavbar />
        <ToastNotification />
        <main id="store-main" className="min-h-screen bg-[#050505] text-white">
          <Outlet />
        </main>
      </StoreProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<OpsDashboardLayout />}>
          <Route index element={<OpsOverviewPage />} />
          <Route path="sessions" element={<OpsSessionsPage />} />
          <Route path="forensics" element={<OpsForensicsPage />} />
          <Route path="analytics" element={<OpsAnalyticsPage />} />
          <Route path="alerts" element={<OpsAlertsPage />} />
        </Route>

        <Route path="/shop" element={<StoreShell />}>
          <Route index element={<StoreHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="login" element={<StoreLoginPage />} />
          <Route path="signup" element={<StoreSignupPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
