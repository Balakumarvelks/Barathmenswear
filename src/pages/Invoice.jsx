import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Invoice.css';

const Invoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const invoiceRef = useRef();

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
    // Check for payment success params if coming directly from Stripe
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get('payment_success');
    const sessionId = params.get('session_id');

    if (paymentSuccess === 'true' && sessionId) {
      api.post('/payments/verify', {
        sessionId: sessionId,
        orderId: orderId
      }).then(() => {
        fetchOrder();
        toast.success('Payment verified');
      }).catch(err => {
        console.error(err);
        fetchOrder();
      });
    } else {
      fetchOrder();
    }
  }, [fetchOrder, orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      const response = await api.post(`/orders/${orderId}/send-invoice`);
      toast.success(response.data.message || 'Invoice sent to your email!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invoice email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Calculate GST breakdown (CGST 2.5% + SGST 2.5% = 5% total)
  const calculateGST = (subtotal, discount, couponDiscount) => {
    const taxableAmount = subtotal - discount - couponDiscount;
    const cgst = Math.ceil(taxableAmount * 0.025);
    const sgst = Math.ceil(taxableAmount * 0.025);
    return { cgst, sgst, total: cgst + sgst };
  };

  if (loading) return <div className="loader">Loading invoice...</div>;

  if (!order) return null;

  const gst = calculateGST(order.subtotal, order.discount, order.couponDiscount);

  return (
    <div className="invoice-page">
      <div className="invoice-actions no-print">
        <button onClick={handlePrint} className="print-btn">
          🖨️ Print Invoice
        </button>
        <button onClick={handleSendEmail} className="email-btn" disabled={sendingEmail}>
          {sendingEmail ? '📧 Sending...' : '📧 Send to Email'}
        </button>
        <Link to={`/order-confirmation/${orderId}`} className="back-btn">
          ← Back to Order
        </Link>
      </div>

      <div className="invoice-container" ref={invoiceRef}>
        {/* Invoice Header */}
        <div className="invoice-header">
          <div className="header-left">
            <div className="gstin">GSTIN: 33AQOPV6830D1ZM</div>
            <div className="company-logo">
              <img src="/logo.png" alt="Barath Men's Wear" className="logo-image" />
            </div>
          </div>
          <div className="header-center">
            <h1 className="company-name">BARATH MENS WEAR</h1>
            <p className="company-address">
              20/5, Kalaiselvi Complex, P.R.S. Road,<br />
              CHENNIMALAI - 638 051
            </p>
          </div>
          <div className="header-right">
            <p>75023 21321</p>
            <p>97880 32102</p>
          </div>
        </div>

        {/* Bill Info */}
        <div className="bill-info">
          <div className="bill-number">
            <span className="label">No:</span>
            <span className="value">{order.orderNumber}</span>
          </div>
          <div className="bill-date">
            <span className="label">Date:</span>
            <span className="value">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="customer-info">
          <span className="label">To M/s</span>
          <span className="value">{order.shippingAddress.fullName}</span>
          <div className="customer-address">
            {order.shippingAddress.street}, {order.shippingAddress.city},<br />
            {order.shippingAddress.state} - {order.shippingAddress.pincode}
          </div>
          <div className="customer-phone">Phone: {order.shippingAddress.phone}</div>
        </div>

        {/* Items Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th className="col-particulars">Particulars</th>
              <th className="col-pcs">Pcs</th>
              <th className="col-rate">Rate</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="item-row">
                <td className="col-sno">{index + 1}</td>
                <td className="col-particulars">
                  {item.name}
                  {item.variant && (item.variant.size || item.variant.color) && (
                    <span className="variant-info">
                      {item.variant.size && ` (${item.variant.size})`}
                      {item.variant.color && ` - ${item.variant.color}`}
                    </span>
                  )}
                </td>
                <td className="col-pcs">{item.quantity}</td>
                <td className="col-rate">{item.price.toFixed(2)}</td>
                <td className="col-amount">{item.total.toFixed(2)}</td>
              </tr>
            ))}

            {/* Empty rows for spacing */}
            {Array.from({ length: Math.max(0, 8 - order.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}

            {/* Discount Row */}
            {(order.discount > 0 || order.couponDiscount > 0) && (
              <tr className="discount-row">
                <td></td>
                <td className="col-particulars">
                  Discount {order.couponCode && `(${order.couponCode})`}
                </td>
                <td></td>
                <td></td>
                <td className="col-amount">-{(order.discount + order.couponDiscount).toFixed(2)}</td>
              </tr>
            )}

            {/* Shipping Row */}
            {order.shippingCharges > 0 && (
              <tr className="shipping-row">
                <td></td>
                <td className="col-particulars">Shipping Charges</td>
                <td></td>
                <td></td>
                <td className="col-amount">{order.shippingCharges.toFixed(2)}</td>
              </tr>
            )}

            {/* CGST Row */}
            <tr className="tax-row">
              <td></td>
              <td className="col-particulars tax-label">CGST 2.5%</td>
              <td></td>
              <td></td>
              <td className="col-amount">{gst.cgst.toFixed(2)}</td>
            </tr>

            {/* SGST Row */}
            <tr className="tax-row">
              <td></td>
              <td className="col-particulars tax-label">SGST 2.5%</td>
              <td></td>
              <td></td>
              <td className="col-amount">{gst.sgst.toFixed(2)}</td>
            </tr>

            {/* Total Row */}
            <tr className="total-row">
              <td></td>
              <td className="col-particulars total-label">TOTAL</td>
              <td></td>
              <td></td>
              <td className="col-amount total-value">{order.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="invoice-footer">
          <div className="eoe">E&O.E</div>
          <div className="signature">
            <p>For Barath Mens Wear</p>
            <div className="signature-line"></div>
            <p className="auth-signatory">Authorized Signatory</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="payment-details">
          <p><strong>Payment Method:</strong> {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</p>
          <p><strong>Payment Status:</strong> <span className={`payment-status ${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span></p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
