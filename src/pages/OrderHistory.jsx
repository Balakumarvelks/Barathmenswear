import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders?status=${filter}`);
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await api.put(`/orders/${orderId}/cancel`, {
        reason: 'Cancelled by customer'
      });
      setOrders(orders.map(o => o._id === orderId ? response.data.order : o));
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return '#3498db';
      case 'CONFIRMED': return '#f39c12';
      case 'PROCESSING': return '#e67e22';
      case 'DELIVERED': return '#27ae60';
      case 'CANCELLED': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (loading) return <div className="loader">Loading orders...</div>;

  return (
    <div className="order-history-container">
      <h1>Order History</h1>
      
      <div className="filter-section">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Orders</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.orderNumber}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-status" style={{ borderColor: getStatusColor(order.orderStatus) }}>
                  <span style={{ color: getStatusColor(order.orderStatus) }}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(item.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
                </div>
                <div className="order-actions">
                  <Link
                    to={`/invoice/${order._id}`}
                    className="btn btn-sm btn-invoice"
                  >
                    🧾 Invoice
                  </Link>
                  {['PLACED', 'CONFIRMED'].includes(order.orderStatus) && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => cancelOrder(order._id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
