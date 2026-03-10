import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaCreditCard, FaTag } from 'react-icons/fa';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(location.state?.cart);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    type: 'HOME'
  });

  useEffect(() => {
    if (!cart) {
      navigate('/cart');
      return;
    }

    // Check for payment cancellation
    const params = new URLSearchParams(location.search);
    if (params.get('payment_cancelled') === 'true') {
      toast.error('Payment was cancelled');
    }

    fetchAddresses();
  }, [cart, navigate, location]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      setAddresses(response.data.addresses);
      const defaultAddr = response.data.addresses.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr._id);
      }
    } catch (error) {
      toast.error('Failed to load addresses');
    }
  };

  const handleAddressChange = (e) => {
    setNewAddress({
      ...newAddress,
      [e.target.name]: e.target.value
    });
  };

  const addNewAddress = async () => {
    try {
      setLoading(true);
      const response = await api.post('/addresses', newAddress);
      setAddresses([...addresses, response.data.address]);
      setSelectedAddress(response.data.address._id);
      setShowAddressForm(false);
      setNewAddress({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        type: 'HOME'
      });
      toast.success('Address added successfully');
    } catch (error) {
      toast.error('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const isAddressSelected = !!selectedAddress;

  const fetchAvailableCoupons = async () => {
    try {
      const response = await api.get('/coupons?limit=20');
      if (response.data.success) {
        setAvailableCoupons(response.data.coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const handleViewCoupons = () => {
    if (!showAvailableCoupons) {
      fetchAvailableCoupons();
    }
    setShowAvailableCoupons(!showAvailableCoupons);
  };

  const handleSelectCoupon = (code) => {
    setCouponCode(code);
    setShowAvailableCoupons(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    try {
      setCouponLoading(true);
      const response = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        orderAmount: cart.totalPrice
      });
      if (response.data.success) {
        setAppliedCoupon(response.data.coupon);
        toast.success(`Coupon applied! You save ₹${response.data.coupon.discount}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      setLoading(true);
      const selectedAddr = addresses.find(a => a._id === selectedAddress);

      // 1. Create Order
      const response = await api.post('/orders', {
        shippingAddress: {
          fullName: selectedAddr.fullName,
          phone: selectedAddr.phone,
          street: selectedAddr.street,
          city: selectedAddr.city,
          state: selectedAddr.state,
          pincode: selectedAddr.pincode,
          country: selectedAddr.country
        },
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      });

      const orderId = response.data.order._id;

      // 2. Handle Payment
      if (paymentMethod === 'ONLINE') {
        try {
          const paymentResponse = await api.post('/payments/initialize', {
            orderId: orderId
          });

          if (paymentResponse.data.success && paymentResponse.data.payment.checkoutUrl) {
            window.location.href = paymentResponse.data.payment.checkoutUrl;
            return;
          } else {
            toast.error('Failed to initialize payment');
            // Optionally navigate to order confirmation but with payment pending status
            navigate(`/order-confirmation/${orderId}`);
          }
        } catch (paymentError) {
          console.error("Payment init error", paymentError);
          toast.error('Payment initialization failed. You can retry from order history.');
          navigate(`/order-confirmation/${orderId}`);
        }
      } else {
        // COD
        toast.success('Order placed successfully');
        navigate(`/order-confirmation/${orderId}`);
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      if (paymentMethod !== 'ONLINE') {
        setLoading(false);
      }
    }
  };

  if (!cart) return <div className="loader">Loading...</div>;

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      <div className="checkout-content">
        <div className="checkout-form">
          {/* Address Selection */}
          <section className="checkout-section">
            <h2>Delivery Address</h2>
            <div className="addresses-list">
              {addresses.map((address) => (
                <label key={address._id} className="address-option">
                  <input
                    type="radio"
                    name="address"
                    value={address._id}
                    checked={selectedAddress === address._id}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                  />
                  <div className="address-content">
                    <p className="address-name">{address.fullName}</p>
                    <p className="address-text">
                      {address.street}, {address.city}, {address.state} {address.pincode}
                    </p>
                    <p className="address-phone">{address.phone}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              className="btn-add-address"
              onClick={() => setShowAddressForm(!showAddressForm)}
            >
              {showAddressForm ? '✕ Hide Form' : '+ Add New Address'}
            </button>

            {showAddressForm && (
              <div className="address-form">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={newAddress.fullName}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={newAddress.phone}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="text"
                  name="street"
                  placeholder="Street Address"
                  value={newAddress.street}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={newAddress.state}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  value={newAddress.pincode}
                  onChange={handleAddressChange}
                  required
                />
                <button
                  className="btn-save-address"
                  onClick={addNewAddress}
                  disabled={loading}
                >
                  Save Address
                </button>
              </div>
            )}
          </section>

          {/* Coupon Code */}
          <section className="checkout-section coupon-section">
            <h2><FaTag /> Coupon Code</h2>
            {!isAddressSelected && (
              <p className="coupon-hint">Please select a delivery address to apply a coupon</p>
            )}
            <div className="coupon-input-group">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!isAddressSelected || !!appliedCoupon}
                className="coupon-input"
              />
              {appliedCoupon ? (
                <button className="btn-remove-coupon" onClick={handleRemoveCoupon}>
                  Remove
                </button>
              ) : (
                <button
                  className="btn-apply-coupon"
                  onClick={handleApplyCoupon}
                  disabled={!isAddressSelected || couponLoading}
                >
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              )}
            </div>
            {appliedCoupon && (
              <div className="coupon-applied">
                <span className="coupon-success">✓ Coupon "{appliedCoupon.code}" applied — You save ₹{appliedCoupon.discount.toFixed(2)}</span>
              </div>
            )}
            {isAddressSelected && !appliedCoupon && (
              <button className="btn-view-coupons" onClick={handleViewCoupons}>
                {showAvailableCoupons ? 'Hide Available Coupons' : 'View Available Coupons'}
              </button>
            )}
            {showAvailableCoupons && (
              <div className="available-coupons-list">
                {availableCoupons.length === 0 ? (
                  <p className="no-coupons">No coupons available right now</p>
                ) : (
                  availableCoupons.map(coupon => (
                    <div key={coupon._id} className="available-coupon-card">
                      <div className="available-coupon-info">
                        <div className="available-coupon-header">
                          <span className="available-coupon-code">{coupon.code}</span>
                          <span className="available-coupon-badge">
                            {`${coupon.value}% OFF`}
                          </span>
                        </div>
                        {coupon.description && <p className="available-coupon-desc">{coupon.description}</p>}
                        <div className="available-coupon-details">
                          {coupon.minOrderAmount > 0 && <span>Min order: ₹{coupon.minOrderAmount}</span>}
                          {coupon.maxDiscount && <span>Max discount: ₹{coupon.maxDiscount}</span>}
                          <span>Valid till: {new Date(coupon.validUntil).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <button
                        className="btn-use-coupon"
                        onClick={() => handleSelectCoupon(coupon.code)}
                      >
                        Use
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="checkout-section">
            <h2>Payment Method</h2>

            {/* COD Info */}
            {/* COD Info */}
            <div
              className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('COD')}
            >
              <div className="payment-header">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <FaMoneyBillWave className="info-icon" />
                <span className="payment-title">Cash on Delivery</span>
              </div>
              {paymentMethod === 'COD' && (
                <p className="payment-desc">Pay with cash when your order is delivered</p>
              )}
            </div>

            {/* Online Payment Info */}
            <div
              className={`payment-option ${paymentMethod === 'ONLINE' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('ONLINE')}
            >
              <div className="payment-header">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                />
                <FaCreditCard className="info-icon" />
                <span className="payment-title">Online Payment (Stripe)</span>
              </div>
              {paymentMethod === 'ONLINE' && (
                <p className="payment-desc">Secure payment via Credit/Debit Card</p>
              )}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>

          <div className="summary-items">
            {cart.items.map((item) => (
              <div key={item._id} className="summary-item">
                <span>{item.product?.name} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{cart.totalPrice?.toFixed(2) || '0.00'}</span>
            </div>

            {cart.discount > 0 && (
              <div className="summary-row">
                <span>Discount:</span>
                <span>-₹{cart.discount?.toFixed(2) || '0.00'}</span>
              </div>
            )}

            {appliedCoupon && (
              <div className="summary-row coupon-discount">
                <span>Coupon ({appliedCoupon.code}):</span>
                <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping:</span>
              <span>₹{cart.totalPrice > 500 ? '0.00' : '50.00'}</span>
            </div>

            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>₹{((cart.finalPrice || 0) - (appliedCoupon ? appliedCoupon.discount : 0)).toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn-place-order"
            onClick={placeOrder}
            disabled={loading || !selectedAddress}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
