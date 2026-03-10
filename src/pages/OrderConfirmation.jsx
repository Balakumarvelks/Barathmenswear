import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './OrderConfirmation.css';

const API_BASE_URL = 'http://localhost:5000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const verifyStripePayment = useCallback(async (sessionId) => {
    try {
      setVerifyingPayment(true);
      const verifyResponse = await api.post('/payments/verify', {
        sessionId: sessionId,
        orderId: orderId
      });

      if (verifyResponse.data.success) {
        toast.success('Payment successful! Order confirmed.');
        // Fetch updated order details
        await fetchOrder();
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      // Don't show error toast - payment might already be verified
    } finally {
      setVerifyingPayment(false);
    }
  }, [orderId]);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    // Check if returning from Stripe payment
    const paymentSuccess = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');

    if (paymentSuccess === 'true' && sessionId) {
      verifyStripePayment(sessionId);
    }

    fetchOrder();
  }, [fetchOrder, searchParams, verifyStripePayment]);

  if (loading || verifyingPayment) return <div className="loader">{verifyingPayment ? 'Verifying payment...' : 'Loading order details...'}</div>;

  if (!order) return null;

  return (
    <div className="order-confirmation">
      <div className="confirmation-container">
        <div className="success-icon">
          <span>✓</span>
        </div>

        <h1>Order Placed Successfully!</h1>
        <p className="confirmation-message">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>

        <div className="order-details-card">
          <div className="order-header">
            <div>
              <h3>Order #{order.orderNumber}</h3>
              <p className="order-date">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="order-status">
              <span className={`status-badge ${order.orderStatus.toLowerCase()}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>

          <div className="order-items">
            <h4>Items Ordered</h4>
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-image">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} />
                  ) : (
                    <div className="no-image">📦</div>
                  )}
                </div>
                <div className="item-details">
                  <p className="item-name">{item.name}</p>
                  {item.variant && (item.variant.size || item.variant.color) && (
                    <p className="item-variant">
                      {item.variant.size && `Size: ${item.variant.size}`}
                      {item.variant.size && item.variant.color && ' | '}
                      {item.variant.color && `Color: ${item.variant.color}`}
                    </p>
                  )}
                  <p className="item-quantity">Qty: {item.quantity}</p>
                </div>
                <div className="item-price">
                  ₹{item.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            {order.couponDiscount > 0 && (
              <div className="summary-row discount">
                <span>Coupon ({order.couponCode})</span>
                <span>-₹{order.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span>{order.shippingCharges > 0 ? `₹${order.shippingCharges.toFixed(2)}` : 'FREE'}</span>
            </div>
            <div className="summary-row">
              <span>Tax (5%)</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="delivery-info">
            <h4>Delivery Address</h4>
            <p className="address-name">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            <p>Phone: {order.shippingAddress.phone}</p>
          </div>

          <div className="payment-info">
            <h4>Payment Method</h4>
            <p>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</p>
            <p className={`payment-status ${order.paymentStatus.toLowerCase()}`}>
              Payment: {order.paymentStatus}
            </p>
          </div>

          {order.estimatedDelivery && (
            <div className="delivery-estimate">
              <h4>Estimated Delivery</h4>
              <p>{new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</p>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <Link to={`/invoice/${orderId}`} className="btn btn-invoice">
            🧾 View Invoice
          </Link>
          <Link to="/orders" className="btn btn-primary">
            View All Orders
          </Link>
          <Link to="/products" className="btn btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
