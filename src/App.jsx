import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProductBrowse from './pages/ProductBrowse';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import OrderConfirmation from './pages/OrderConfirmation';
import Invoice from './pages/Invoice';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import ManageUsers from './pages/ManageUsers';
import AdminProducts from './pages/AdminProducts';
import AdminProductVariants from './pages/AdminProductVariants';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminInventory from './pages/AdminInventory';
import AdminCoupons from './pages/AdminCoupons';

import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Wraps a page in PrivateRoute (admin-only) + AdminLayout sidebar */
const AdminRoute = ({ children }) => (
  <PrivateRoute adminOnly={true}>
    <AdminLayout>{children}</AdminLayout>
  </PrivateRoute>
);

/** Shows/hides the customer Navbar based on current path */
const ConditionalNavbar = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return <Navbar />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'not-configured'}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="app">
            <ConditionalNavbar />

            <Routes>
              {/* ── Public Routes ── */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/products" element={<ProductBrowse />} />
              <Route path="/products/:id" element={<ProductDetail />} />

              {/* ── Customer Protected Routes ── */}
              <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
              <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
              <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
              <Route path="/order-confirmation/:orderId" element={<PrivateRoute><OrderConfirmation /></PrivateRoute>} />
              <Route path="/invoice/:orderId" element={<PrivateRoute><Invoice /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

              {/* ── Admin Routes (sidebar layout) ── */}
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/products/:id/variants" element={<AdminRoute><AdminProductVariants /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
              <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
