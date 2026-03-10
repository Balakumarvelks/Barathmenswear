import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    paymentStatus: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/orders/admin/all?';
      if (filter.status) url += `status=${filter.status}&`;
      if (filter.paymentStatus) url += `paymentStatus=${filter.paymentStatus}&`;
      
      const response = await api.get(url);
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.paymentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { 
        status: newStatus 
      });
      setOrders(orders.map(o => o._id === orderId ? response.data.order : o));
      toast.success(`Order status updated to ${newStatus}`);
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.order);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order');
    }
  };

  const updatePaymentStatus = async (orderId, status) => {
    try {
      const response = await api.put(`/orders/${orderId}/payment-status`, { 
        status 
      });
      setOrders(orders.map(o => o._id === orderId ? response.data.order : o));
      toast.success('Payment status updated');
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.order);
      }
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      setOrders(orders.map(o => o._id === orderId ? response.data.order : o));
      toast.success('Order cancelled');
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.order);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const processRefund = async (orderId) => {
    if (!window.confirm('Process refund for this order?')) return;

    try {
      const response = await api.post(`/orders/${orderId}/refund`);
      setOrders(orders.map(o => o._id === orderId ? response.data.order : o));
      toast.success('Refund processed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'PLACED': '#3498db',
      'CONFIRMED': '#f39c12',
      'PROCESSING': '#e67e22',
      'DELIVERED': '#27ae60',
      'CANCELLED': '#e74c3c',
      'RETURNED': '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'PENDING': '#f39c12',
      'PAID': '#27ae60',
      'FAILED': '#e74c3c',
      'REFUNDED': '#9b59b6'
    };
    return colors[status] || '#95a5a6';
  };

  const filteredOrders = orders.filter(order => {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return order.orderNumber?.toLowerCase().includes(searchLower) ||
             order.shippingAddress?.fullName?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  if (loading) return <div className="admin-loading">Loading orders...</div>;

  return (
    <div className="admin-orders">
      <div className="admin-container">
        <div className="page-header">
          <h1>Order Management</h1>
          <div className="order-stats">
            <span className="stat-badge">Total: {orders.length}</span>
            <span className="stat-badge pending">Pending: {orders.filter(o => o.orderStatus === 'PLACED').length}</span>
            <span className="stat-badge delivered">Delivered: {orders.filter(o => o.orderStatus === 'DELIVERED').length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="search-input"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filter.paymentStatus}
            onChange={(e) => setFilter({ ...filter, paymentStatus: e.target.value })}
          >
            <option value="">All Payments</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order._id}>
                  <td className="order-number">{order.orderNumber}</td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{order.shippingAddress?.fullName}</span>
                      <span className="customer-phone">{order.shippingAddress?.phone}</span>
                    </div>
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td className="order-total">₹{order.totalAmount?.toFixed(2)}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus) + '20', color: getPaymentStatusColor(order.paymentStatus) }}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.orderStatus) + '20', color: getStatusColor(order.orderStatus) }}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="view-btn"
                        onClick={() => viewOrderDetails(order)}
                      >
                        View
                      </button>
                      {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                        <button 
                          className="cancel-btn"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="no-orders">
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order #{selectedOrder.orderNumber}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-detail-grid">
                {/* Customer & Shipping Info */}
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedOrder.shippingAddress?.fullName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone}</p>
                  <p><strong>Address:</strong></p>
                  <p>{selectedOrder.shippingAddress?.street}</p>
                  <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}</p>
                </div>

                {/* Order Status */}
                <div className="detail-section">
                  <h4>Order Status</h4>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                    className="status-select"
                    disabled={selectedOrder.orderStatus === 'CANCELLED' || selectedOrder.orderStatus === 'DELIVERED'}
                  >
                    <option value="PLACED">Placed</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>

                  <h4 style={{ marginTop: '15px' }}>Payment Status</h4>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => updatePaymentStatus(selectedOrder._id, e.target.value)}
                    className="status-select"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>

                  <p style={{ marginTop: '10px' }}><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="detail-section">
                <h4>Order Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>
                          {item.variant?.size && `Size: ${item.variant.size}`}
                          {item.variant?.color && ` | Color: ${item.variant.color}`}
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price?.toFixed(2)}</td>
                        <td>₹{item.total?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="order-summary-modal">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount:</span>
                    <span>-₹{selectedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.couponDiscount > 0 && (
                  <div className="summary-row discount">
                    <span>Coupon ({selectedOrder.couponCode}):</span>
                    <span>-₹{selectedOrder.couponDiscount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>₹{selectedOrder.shippingCharges?.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>₹{selectedOrder.tax?.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Status History */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="detail-section">
                  <h4>Status History</h4>
                  <div className="status-timeline">
                    {selectedOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="timeline-item">
                        <span className="timeline-status">{history.status}</span>
                        <span className="timeline-date">
                          {new Date(history.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedOrder.orderStatus === 'CANCELLED' && selectedOrder.paymentStatus === 'PAID' && (
                <div className="refund-section">
                  <button 
                    className="refund-btn"
                    onClick={() => processRefund(selectedOrder._id)}
                  >
                    Process Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
