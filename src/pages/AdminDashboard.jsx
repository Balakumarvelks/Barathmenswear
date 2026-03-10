import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import {
  FaUsers, FaUserShield, FaUserCheck, FaUserTimes, FaClock,
  FaRupeeSign, FaShoppingCart, FaBoxes, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaChartLine, FaWarehouse,
  FaClipboardList, FaTags, FaChartBar, FaTicketAlt
} from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all data with individual error handling
      const dashboardRes = await adminService.getDashboard().catch(() => ({ data: { data: {} } }));
      const overviewRes = await adminService.getDashboardOverview('', '').catch(() => ({ data: { overview: {} } }));
      const inventoryRes = await adminService.getInventoryAnalytics().catch(() => ({ data: { analytics: {} } }));

      setStats(dashboardRes.data.data);
      setOverview(overviewRes.data.overview);
      setInventory(inventoryRes.data.analytics);
    } catch (error) {
      console.log('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED': return <FaCheckCircle className="status-icon delivered" />;
      case 'CANCELLED': return <FaTimesCircle className="status-icon cancelled" />;
      case 'PROCESSING': return <FaBoxes className="status-icon processing" />;
      default: return <FaClock className="status-icon pending" />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your retail management platform</p>
      </div>

      {/* Revenue & Orders Section */}
      <div className="section-title">
        <FaChartLine /> Revenue & Orders
      </div>
      <div className="stats-grid revenue-grid">
        <div className="stat-card revenue">
          <div className="stat-icon">
            <FaRupeeSign />
          </div>
          <div className="stat-content">
            <h3>₹{(overview?.totalRevenue || 0).toLocaleString('en-IN')}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <h3>{overview?.totalOrders || 0}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card discount">
          <div className="stat-icon">
            <FaTags />
          </div>
          <div className="stat-content">
            <h3>₹{(overview?.totalDiscount || 0).toLocaleString('en-IN')}</h3>
            <p>Total Discounts</p>
          </div>
        </div>

        <div className="stat-card avg-order">
          <div className="stat-icon">
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>₹{overview?.totalOrders > 0 ? Math.round(overview.totalRevenue / overview.totalOrders).toLocaleString('en-IN') : 0}</h3>
            <p>Avg Order Value</p>
          </div>
        </div>
      </div>

      {/* Order Status Section */}
      <div className="section-title">
        <FaClipboardList /> Order Status
      </div>
      <div className="order-status-grid">
        {overview?.orderStatusBreakdown?.length > 0 ? (
          overview.orderStatusBreakdown.map((status) => (
            <div key={status._id} className={`order-status-card ${status._id?.toLowerCase()}`}>
              {getOrderStatusIcon(status._id)}
              <div className="status-content">
                <h3>{status.count}</h3>
                <p>{status._id || 'Pending'}</p>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="order-status-card pending">
              <FaClock className="status-icon pending" />
              <div className="status-content">
                <h3>0</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="order-status-card processing">
              <FaBoxes className="status-icon processing" />
              <div className="status-content">
                <h3>0</h3>
                <p>Processing</p>
              </div>
            </div>
            <div className="order-status-card delivered">
              <FaCheckCircle className="status-icon delivered" />
              <div className="status-content">
                <h3>0</h3>
                <p>Delivered</p>
              </div>
            </div>
            <div className="order-status-card cancelled">
              <FaTimesCircle className="status-icon cancelled" />
              <div className="status-content">
                <h3>0</h3>
                <p>Cancelled</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stock Status Section */}
      <div className="section-title">
        <FaWarehouse /> Stock Status
      </div>
      <div className="stats-grid stock-grid">
        <div className="stat-card in-stock">
          <div className="stat-icon">
            <FaBoxes />
          </div>
          <div className="stat-content">
            <h3>{(inventory?.totalInventory || 0) - (inventory?.lowStockItems || 0) - (inventory?.outOfStockItems || 0)}</h3>
            <p>In Stock</p>
          </div>
        </div>

        <div className="stat-card low-stock">
          <div className="stat-icon">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>{inventory?.lowStockItems || 0}</h3>
            <p>Low Stock</p>
          </div>
        </div>

        <div className="stat-card out-of-stock">
          <div className="stat-icon">
            <FaTimesCircle />
          </div>
          <div className="stat-content">
            <h3>{inventory?.outOfStockItems || 0}</h3>
            <p>Out of Stock</p>
          </div>
        </div>

        <div className="stat-card total-products">
          <div className="stat-icon">
            <FaBoxes />
          </div>
          <div className="stat-content">
            <h3>{inventory?.totalInventory || 0}</h3>
            <p>Total Products</p>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="section-title">
        <FaUsers /> User Statistics
      </div>
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{stats?.totalUsers || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card customers">
          <div className="stat-icon">
            <FaUserCheck />
          </div>
          <div className="stat-content">
            <h3>{stats?.totalCustomers || 0}</h3>
            <p>Customers</p>
          </div>
        </div>

        <div className="stat-card admins">
          <div className="stat-icon">
            <FaUserShield />
          </div>
          <div className="stat-content">
            <h3>{stats?.totalAdmins || 0}</h3>
            <p>Admins</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">
            <FaUserCheck />
          </div>
          <div className="stat-content">
            <h3>{stats?.activeUsers || 0}</h3>
            <p>Active Users</p>
          </div>
        </div>

        <div className="stat-card inactive">
          <div className="stat-icon">
            <FaUserTimes />
          </div>
          <div className="stat-content">
            <h3>{stats?.inactiveUsers || 0}</h3>
            <p>Inactive Users</p>
          </div>
        </div>

        <div className="stat-card recent">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>{stats?.recentUsers || 0}</h3>
            <p>New Users (7 days)</p>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-row">
          <a href="/admin/users" className="action-card">
            <FaUsers /> Manage Users
          </a>
          <a href="/admin/products" className="action-card">
            <FaBoxes /> Manage Products
          </a>
          <a href="/admin/orders" className="action-card">
            <FaClipboardList /> View Orders
          </a>
          <a href="/admin/inventory" className="action-card">
            <FaWarehouse /> Manage Inventory
          </a>
          <a href="/admin/coupons" className="action-card">
            <FaTicketAlt /> Manage Coupons
          </a>
          <a href="/admin/analytics" className="action-card">
            <FaChartLine /> View Analytics
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
