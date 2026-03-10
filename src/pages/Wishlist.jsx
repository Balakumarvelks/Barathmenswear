import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './Wishlist.css';

const API_BASE_URL = 'http://localhost:5000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const Wishlist = () => {
  const navigate = useNavigate();
  const { fetchCartCount } = useAuth();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist');
      setWishlist(response.data.wishlist);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      setWishlist(response.data.wishlist);
      toast.success('Item removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const addToCart = async (productId) => {
    try {
      await api.post('/cart/add', {
        productId,
        quantity: 1
      });
      fetchCartCount();
      toast.success('Item added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) return <div className="loader">Loading wishlist...</div>;

  return (
    <div className="wishlist-container">
      <h1>My Wishlist</h1>
      
      {!wishlist || wishlist.items.length === 0 ? (
        <div className="empty-wishlist">
          <p>Your wishlist is empty</p>
          <button className="btn-continue-shopping" onClick={() => navigate('/products')}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.items.map((item) => (
            <div key={item._id} className="wishlist-card">
              <div className="product-image">
                {item.product?.images?.[0] && (
                  <img src={getImageUrl(item.product.images[0].url)} alt={item.product?.name} />
                )}
              </div>
              
              <div className="product-details">
                <h3>{item.product?.name}</h3>
                <p className="brand">{item.product?.brand}</p>
                
                <div className="price-section">
                  <span className="original-price">
                    ₹{item.product?.price?.toFixed(2)}
                  </span>
                  <span className="final-price">
                    ₹{item.product?.finalPrice?.toFixed(2)}
                  </span>
                  {item.product?.discount > 0 && (
                    <span className="discount-badge">
                      {item.product.discount}% OFF
                    </span>
                  )}
                </div>

                <div className="stock-info">
                  {item.product?.stock > 0 ? (
                    <span className="in-stock">In Stock</span>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => addToCart(item.product._id)}
                    disabled={item.product?.stock <= 0}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/products/${item.product._id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-danger btn-icon"
                    onClick={() => removeFromWishlist(item.product._id)}
                    title="Remove from wishlist"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
