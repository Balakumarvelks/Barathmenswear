import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import FindMySize from '../components/FindMySize';
import './ProductDetail.css';

const API_BASE_URL = 'http://localhost:5000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, fetchCartCount } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [inWishlist, setInWishlist] = useState(false);
  const [showFindMySize, setShowFindMySize] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchRelatedProducts = useCallback(async (categoryId) => {
    try {
      const response = await api.get(`/products?category=${categoryId}&limit=4`);
      if (response.data.success) {
        setRelatedProducts(
          response.data.products.filter(p => p._id !== id)
        );
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  }, [id]);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.product);
        
        // Fetch related products from same category
        fetchRelatedProducts(response.data.product.category._id);
      }
    } catch (error) {
      toast.error('Error loading product');
      console.error('Error:', error);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, fetchRelatedProducts]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const checkWishlistStatus = useCallback(async () => {
    // Check if user is authenticated or has a token
    const token = localStorage.getItem('token');
    if (!isAuthenticated && !token) {
      setInWishlist(false);
      return;
    }
    try {
      const response = await api.get(`/wishlist/${id}`);
      setInWishlist(response.data.inWishlist);
    } catch (error) {
      // Silently fail - user might not be logged in
      setInWishlist(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    checkWishlistStatus();
  }, [checkWishlistStatus]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get(`/reviews/${id}`);
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Please login to submit a review');
      return;
    }
    if (reviewRating === 0) {
      toast.warning('Please select a rating');
      return;
    }
    setSubmittingReview(true);
    try {
      const response = await api.post(`/reviews/${id}`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment
      });
      if (response.data.success) {
        toast.success('Review submitted successfully!');
        setReviewRating(0);
        setReviewTitle('');
        setReviewComment('');
        fetchReviews();
        fetchProduct();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      if (response.data.success) {
        toast.success('Review deleted');
        fetchReviews();
        fetchProduct();
      }
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleAddToCart = async () => {
    if (product.variants && product.variants.length > 0) {
      if (!selectedSize || !selectedColor) {
        toast.warning('Please select size and color');
        return;
      }
    }

    try {
      const cartData = {
        productId: product._id,
        quantity,
        variant: selectedSize || selectedColor ? {
          size: selectedSize,
          color: selectedColor
        } : undefined
      };

      const response = await api.post('/cart/add', cartData);
      
      if (response.data.success) {
        fetchCartCount();
        toast.success('Product added to cart!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
      console.error('Error:', error);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${product._id}`);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist/add', { productId: product._id });
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="loading-page">Loading product...</div>;
  }

  if (!product) {
    return <div className="error-page">Product not found</div>;
  }

  const uniqueSizes = [...new Set(product.variants?.map(v => v.size) || [])];
  const uniqueColors = product.variants
    ?.filter(v => v.size === selectedSize)
    .map(v => v.color) || [];
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div className="product-detail">
      <div className="detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/products')}>Products</button>
          <span>/</span>
          <button onClick={() => navigate(`/products?category=${product.category._id}`)}>
            {product.category.name}
          </button>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="detail-content">
          {/* Image Gallery */}
          <div className="image-section">
            <div className="main-image">
              {product.images?.length > 0 ? (
                <img src={getImageUrl(product.images[selectedImage]?.url)} alt={product.name} />
              ) : (
                <div className="no-image">No Image Available</div>
              )}
              {product.discount > 0 && (
                <div className="discount-badge">{product.discount}% OFF</div>
              )}
            </div>
            <div className="image-thumbnails">
              {product.images?.map((img, idx) => (
                <div
                  key={idx}
                  className={`thumbnail ${idx === selectedImage ? 'active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={getImageUrl(img.url)} alt={`View ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="info-section">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="brand-category">
              <span className="brand-tag">{product.brand}</span>
              <span className="category-tag">{product.category.name}</span>
            </div>

            {/* Rating */}
            <div className="rating-section">
              <div className="stars">
                {'★'.repeat(Math.round(product.ratings.average))}
                {'☆'.repeat(5 - Math.round(product.ratings.average))}
              </div>
              <span className="rating-value">{product.ratings.average.toFixed(1)}</span>
              <span className="review-count">({product.ratings.count} reviews)</span>
            </div>

            {/* Price */}
            <div className="price-section">
              <div className="price-main">
                <span className="final-price">₹{product.finalPrice.toFixed(2)}</span>
                {product.discount > 0 && (
                  <>
                    <span className="original-price">₹{product.price.toFixed(2)}</span>
                    <span className="discount-percent">Save {product.discount}%</span>
                  </>
                )}
              </div>
              <div className="stock-status">
                {product.stock > 0 ? (
                  <span className="in-stock">In Stock ({product.stock} available)</span>
                ) : (
                  <span className="out-of-stock">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="description-section">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="variants-section">
                {/* Size Selection */}
                {uniqueSizes.length > 0 && (
                  <div className="variant-group">
                    <div className="size-header">
                      <label>Size</label>
                      <button 
                        className="find-my-size-btn"
                        onClick={() => setShowFindMySize(true)}
                      >
                        🧠 Find My Size
                      </button>
                    </div>
                    <div className="size-options">
                      {uniqueSizes.map(size => (
                        <button
                          key={size}
                          className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedSize(size);
                            setSelectedColor(''); // Reset color when size changes
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {uniqueColors.length > 0 && (
                  <div className="variant-group">
                    <label>Color</label>
                    <div className="color-options">
                      {uniqueColors.map(color => (
                        <button
                          key={color}
                          className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                          onClick={() => setSelectedColor(color)}
                          style={{
                            backgroundColor: color.toLowerCase(),
                            border: selectedColor === color ? '3px solid #000' : '1px solid #ddd'
                          }}
                          title={color}
                        >
                          {selectedColor === color && (
                            <span className="checkmark">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantity</label>
                <div className="quantity-control">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity === 1}
                  >
                    -
                  </button>
                  <input type="number" value={quantity} readOnly />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <button 
                className="wishlist-btn" 
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                onClick={handleToggleWishlist}
              >
                {inWishlist ? '♥' : '♡'}
              </button>
            </div>

            {/* Additional Info */}
            <div className="info-boxes">
              <div className="info-box">
                <span className="info-icon">✓</span>
                <div>
                  <strong>Free Shipping</strong>
                  <p>On orders above ₹500</p>
                </div>
              </div>
              <div className="info-box">
                <span className="info-icon">↩</span>
                <div>
                  <strong>Easy Returns</strong>
                  <p>30 days return policy</p>
                </div>
              </div>
              <div className="info-box">
                <span className="info-icon">🛡</span>
                <div>
                  <strong>Secure Payment</strong>
                  <p>100% safe transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2>Customer Reviews ({reviews.length})</h2>

          {/* Submit Review Form */}
          {isAuthenticated && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <h3>Write a Review</h3>
              <div className="star-rating-input">
                <label>Your Rating</label>
                <div className="star-select">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star-pick ${star <= (reviewHover || reviewRating) ? 'filled' : ''}`}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <input
                type="text"
                placeholder="Review title (optional)"
                value={reviewTitle}
                onChange={e => setReviewTitle(e.target.value)}
                maxLength={100}
                className="review-title-input"
              />
              <textarea
                placeholder="Write your review..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                required
                maxLength={1000}
                rows={4}
                className="review-comment-input"
              />
              <button type="submit" className="submit-review-btn" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {!isAuthenticated && (
            <p className="login-to-review">Please <span onClick={() => navigate('/login')}>login</span> to write a review.</p>
          )}

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="review-user">
                      <strong>{review.user.firstName} {review.user.lastName}</strong>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="review-stars">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  {review.title && <h4 className="review-title">{review.title}</h4>}
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>Related Products</h2>
            <div className="related-grid">
              {relatedProducts.map(p => (
                <div
                  key={p._id}
                  className="related-card"
                  onClick={() => navigate(`/products/${p._id}`)}
                >
                  <div className="related-image">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={getImageUrl(p.images.find(img => img.isPrimary)?.url || p.images[0].url)}
                        alt={p.name}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <h4>{p.name}</h4>
                  <p className="brand-name">{p.brand}</p>
                  <p className="price">₹{p.finalPrice.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Find My Size Modal */}
      <FindMySize 
        isOpen={showFindMySize}
        onClose={() => setShowFindMySize(false)}
        onSizeSelect={(size) => {
          setSelectedSize(size);
          setShowFindMySize(false);
        }}
        productSizes={uniqueSizes}
      />
    </div>
  );
}

export default ProductDetail;
