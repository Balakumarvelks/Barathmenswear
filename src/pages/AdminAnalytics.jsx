import React, { useState, useEffect } from 'react';
import {
  FaShoppingCart, FaRupeeSign, FaUsers, FaUserPlus,
  FaArrowUp, FaBoxOpen, FaChartLine, FaTrophy, FaFire
} from 'react-icons/fa';
import api from '../services/api.jsx';
import './AdminAnalytics.css';

const STATUS_CONFIG = {
  PENDING: { color: '#f59e0b', bg: '#fef3c7' },
  PROCESSING: { color: '#3b82f6', bg: '#dbeafe' },
  SHIPPED: { color: '#8b5cf6', bg: '#ede9fe' },
  DELIVERED: { color: '#10b981', bg: '#d1fae5' },
  CANCELLED: { color: '#ef4444', bg: '#fee2e2' },
};

const AdminAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovRes, salesRes, prodRes] = await Promise.all([
        api.get('/admin/dashboard/overview').catch(() => ({ data: { overview: {} } })),
        api.get('/admin/dashboard/sales').catch(() => ({ data: { salesData: [] } })),
        api.get('/admin/dashboard/top-products').catch(() => ({ data: { topProducts: [] } })),
      ]);
      setOverview(ovRes.data.overview || {});
      setSalesData(salesRes.data.salesData || []);
      setTopProducts(prodRes.data.topProducts || []);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  if (loading) return (
    <div className="analytics-loading">
      <div className="analytics-spinner" />
      <p>Loading analytics…</p>
    </div>
  );

  const maxOrders = Math.max(...(overview?.orderStatusBreakdown?.map(i => i.count) || [1]), 1);
  const maxSales = Math.max(...salesData.map(i => i.totalSales || 0), 1);

  const kpis = [
    {
      label: 'Total Orders',
      value: overview?.totalOrders || 0,
      icon: <FaShoppingCart />,
      color: '#6366f1',
      bg: 'linear-gradient(135deg,#6366f1,#818cf8)',
    },
    {
      label: 'Total Revenue',
      value: `₹${fmt(overview?.totalRevenue)}`,
      icon: <FaRupeeSign />,
      color: '#10b981',
      bg: 'linear-gradient(135deg,#10b981,#34d399)',
    },
    {
      label: 'Total Customers',
      value: overview?.totalCustomers || 0,
      icon: <FaUsers />,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    },
    {
      label: 'New This Month',
      value: overview?.newCustomersThisMonth || 0,
      icon: <FaUserPlus />,
      color: '#ec4899',
      bg: 'linear-gradient(135deg,#ec4899,#f472b6)',
    },
  ];

  return (
    <div className="analytics-page">

      {/* ── KPI Cards ── */}
      <div className="analytics-kpi-grid">
        {kpis.map((k) => (
          <div className="analytics-kpi-card" key={k.label}>
            <div className="kpi-icon-wrap" style={{ background: k.bg }}>
              {k.icon}
            </div>
            <div className="kpi-text">
              <span className="kpi-val">{k.value}</span>
              <span className="kpi-lbl">{k.label}</span>
            </div>
            <FaArrowUp className="kpi-trend" />
          </div>
        ))}
      </div>

      {/* ── Two column: Status + Sales Bar ── */}
      <div className="analytics-row">

        {/* Order Status Breakdown */}
        <div className="analytics-card">
          <div className="card-header">
            <FaChartLine className="card-icon indigo" />
            <h2>Order Status Breakdown</h2>
          </div>

          {overview?.orderStatusBreakdown?.length ? (
            <div className="status-list">
              {overview.orderStatusBreakdown.map((item) => {
                const cfg = STATUS_CONFIG[item._id] || { color: '#64748b', bg: '#f1f5f9' };
                const pct = Math.round((item.count / maxOrders) * 100);
                return (
                  <div className="status-row" key={item._id}>
                    <span className="status-pill" style={{ background: cfg.bg, color: cfg.color }}>
                      {item._id}
                    </span>
                    <div className="status-track">
                      <div
                        className="status-fill"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                    <span className="status-count">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="analytics-empty">No order data yet.</p>
          )}
        </div>

        {/* Sales Bar Chart */}
        <div className="analytics-card">
          <div className="card-header">
            <FaFire className="card-icon orange" />
            <h2>Daily Sales (Last 10 Days)</h2>
          </div>

          {salesData.length ? (
            <div className="bar-chart">
              {salesData.slice(-10).map((item) => {
                const h = Math.max(Math.round((item.totalSales / maxSales) * 140), 6);
                return (
                  <div className="bar-col" key={item._id}>
                    <span className="bar-tip">₹{((item.totalSales || 0) / 1000).toFixed(1)}k</span>
                    <div className="bar-bar" style={{ height: `${h}px` }} />
                    <span className="bar-label">{String(item._id).slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="analytics-empty">No sales data yet.</p>
          )}
        </div>
      </div>

      {/* ── Sales Table ── */}
      <div className="analytics-card full-width">
        <div className="card-header">
          <FaChartLine className="card-icon green" />
          <h2>Sales Analytics</h2>
        </div>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Total Sales</th>
                <th>Avg Order Value</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {salesData.slice(0, 10).map((item) => {
                const pct = Math.round(((item.totalSales || 0) / maxSales) * 100);
                return (
                  <tr key={item._id}>
                    <td><span className="date-chip">{item._id}</span></td>
                    <td><strong>{item.orderCount || 0}</strong></td>
                    <td className="revenue-cell">₹{fmt(item.totalSales)}</td>
                    <td>₹{fmt(item.averageOrderValue)}</td>
                    <td>
                      <div className="perf-track">
                        <div className="perf-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!salesData.length && (
                <tr><td colSpan={5} className="analytics-empty">No sales data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top Products ── */}
      <div className="analytics-card full-width">
        <div className="card-header">
          <FaTrophy className="card-icon gold" />
          <h2>Top Selling Products</h2>
        </div>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>Revenue Share</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalRev = topProducts.reduce((s, p) => s + (p.totalRevenue || 0), 0) || 1;
                return topProducts.map((item, idx) => {
                  const share = Math.round(((item.totalRevenue || 0) / totalRev) * 100);
                  return (
                    <tr key={item._id}>
                      <td>
                        <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                      </td>
                      <td><strong>{item.productName || '—'}</strong></td>
                      <td>{item.productBrand || '—'}</td>
                      <td>
                        <span className="qty-pill">{item.totalSold || 0}</span>
                      </td>
                      <td className="revenue-cell">₹{fmt(item.totalRevenue)}</td>
                      <td>
                        <div className="share-wrap">
                          <div className="perf-track">
                            <div className="perf-fill gold-fill" style={{ width: `${share}%` }} />
                          </div>
                          <span className="share-pct">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
              {!topProducts.length && (
                <tr><td colSpan={6} className="analytics-empty">No product data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminAnalytics;
