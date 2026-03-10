import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const API_BASE_URL = 'http://localhost:5000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const Cart = () => {
  const navigate = useNavigate();
  const { fetchCartCount } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCart(response.data.cart);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }
      
      const response = await api.put(`/cart/item/${itemId}`, { quantity });
      setCart(response.data.cart);
      fetchCartCount();
      toast.success('Cart updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await api.delete(`/cart/item/${itemId}`);
      setCart(response.data.cart);
      fetchCartCount();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };



  const proceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    navigate('/checkout', { state: { cart } });
  };

  if (loading) return <div className="loader">Loading cart...</div>;

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      
      {!cart || cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button className="btn-continue-shopping" onClick={() => navigate('/products')}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="product-info">
                        {item.product?.images?.[0] && (
                          <img src={getImageUrl(item.product.images[0].url)} alt={item.product.name} />
                        )}
                        <div>
                          <p className="product-name">{item.product?.name}</p>
                          {item.variant && (
                            <p className="variant-info">
                              {item.variant.size && `Size: ${item.variant.size}`}
                              {item.variant.size && item.variant.color && ' | '}
                              {item.variant.color && `Color: ${item.variant.color}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>
                      <div className="quantity-control">
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                          min="1"
                        />
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                      </div>
                    </td>
                    <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn-remove"
                        onClick={() => removeItem(item._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{cart.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>

              {cart.discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount:</span>
                  <span>-₹{cart.discount?.toFixed(2) || '0.00'}</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{cart.finalPrice?.toFixed(2) || '0.00'}</span>
              </div>

              <button
                className="btn-checkout"
                onClick={proceedToCheckout}
              >
                Proceed to Checkout
              </button>

              <button
                className="btn-continue-secondary"
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
