import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updateprofile', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  forgotPassword: (email) => api.post('/auth/forgotpassword', { email }),
  resetPassword: (token, password) => api.put(`/auth/resetpassword/${token}`, { password }),
  logout: () => api.get('/auth/logout')
};

// Admin Services
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDashboardOverview: (startDate, endDate) => api.get(`/admin/dashboard/overview?startDate=${startDate}&endDate=${endDate}`),
  getSalesAnalytics: (period) => api.get(`/admin/dashboard/sales?period=${period}`),
  getTopProducts: (limit) => api.get(`/admin/dashboard/top-products?limit=${limit}`),
  getCategoryPerformance: () => api.get('/admin/dashboard/category-performance'),
  getCustomerAnalytics: () => api.get('/admin/dashboard/customers'),
  getPaymentAnalytics: () => api.get('/admin/dashboard/payments'),
  getInventoryAnalytics: () => api.get('/admin/dashboard/inventory'),
  getCouponAnalytics: () => api.get('/admin/dashboard/coupons'),
  getUsers: (page = 1, limit = 10) => api.get(`/admin/users?page=${page}&limit=${limit}`),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`)
};

// Cart Services
export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (itemId, data) => api.put(`/cart/item/${itemId}`, data),
  removeFromCart: (itemId) => api.delete(`/cart/item/${itemId}`),
  clearCart: () => api.delete('/cart')
};

// Wishlist Services
export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (data) => api.post('/wishlist/add', data),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  isInWishlist: (productId) => api.get(`/wishlist/${productId}`),
  clearWishlist: () => api.delete('/wishlist')
};

// Order Services
export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getUserOrders: (status, page, limit) => api.get(`/orders?status=${status}&page=${page}&limit=${limit}`),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason })
};

// Payment Services
export const paymentService = {
  getPaymentByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
  initializePayment: (data) => api.post('/payments/initialize', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  processRefund: (paymentId, data) => api.post(`/payments/${paymentId}/refund`, data),
  getPaymentHistory: (page, limit, status) => api.get(`/payments/history?page=${page}&limit=${limit}&status=${status}`)
};

// Address Services
export const addressService = {
  getAddresses: () => api.get('/addresses'),
  getAddress: (id) => api.get(`/addresses/${id}`),
  createAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => api.put(`/addresses/${id}/default`)
};

// Coupon Services
export const couponService = {
  getCoupons: (page, limit) => api.get(`/coupons?page=${page}&limit=${limit}`),
  validateCoupon: (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
  getAllCoupons: (page, limit, status) => api.get(`/coupons/admin/all?page=${page}&limit=${limit}&status=${status}`),
  getCouponAnalytics: (id) => api.get(`/coupons/${id}/analytics`)
};

// Inventory Services
export const inventoryService = {
  getInventory: (page, limit, search, lowStockOnly) => api.get(`/admin/inventory?page=${page}&limit=${limit}&search=${search}&lowStockOnly=${lowStockOnly}`),
  getInventoryItem: (id) => api.get(`/admin/inventory/${id}`),
  updateInventory: (id, data) => api.put(`/admin/inventory/${id}`, data),
  setThreshold: (id, data) => api.put(`/admin/inventory/${id}/threshold`, data),
  getLowStockAlerts: () => api.get('/admin/inventory/alerts/low-stock'),
  getOutOfStockItems: () => api.get('/admin/inventory/alerts/out-of-stock'),
  getStockMovements: (id, page, limit) => api.get(`/admin/inventory/${id}/movements?page=${page}&limit=${limit}`)
};

export default api;
