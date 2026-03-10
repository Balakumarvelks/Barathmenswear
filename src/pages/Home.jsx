import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import api from '../services/api';
import logo from '../assets/logo.png';
import './Home.css';

const API_BASE_URL = 'http://localhost:5000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const Home = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.log('Failed to load categories');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Default categories with images if API doesn't return any
  const defaultCategories = [
    { name: 'Shirts', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=200&fit=crop', icon: '👔' },
    { name: 'Pants', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=200&fit=crop', icon: '👖' },
    { name: 'T-Shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=200&fit=crop', icon: '👕' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop', icon: '⌚' }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <img src={logo} alt="Barath Men's Wear" className="hero-logo" />
          <h1>Barath Men's Wear</h1>
          <p className="tagline">Premium Men's Fashion Store</p>
          <div className="hero-buttons">
            <Link to="/register" className="hero-btn primary">
              <FaUserPlus /> Get Started
            </Link>
            <Link to="/login" className="hero-btn secondary">
              <FaSignInAlt /> Login
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👔</div>
            <h3>Premium Quality</h3>
            <p>Handpicked collection of finest fabrics and designs</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Best Prices</h3>
            <p>Competitive pricing without compromising quality</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎁</div>
            <h3>Combo Offers</h3>
            <p>Special bundle deals and exciting combo discounts</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">↩️</div>
            <h3>Easy Returns</h3>
            <p>Hassle-free return policy for your convenience</p>
          </div>
        </div>
      </div>

      <div className="categories-section">
        <h2>Our Categories</h2>
        <div className="categories-grid">
          {displayCategories.map((category, index) => (
            <Link 
              to={`/products?category=${category.name || category}`} 
              key={index} 
              className="category-card"
            >
              {category.image ? (
                <div className="category-image">
                  <img src={getImageUrl(category.image)} alt={category.name || category} />
                </div>
              ) : (
                <div className="category-icon-placeholder">
                  {category.icon || <FaShoppingBag />}
                </div>
              )}
              <span className="category-name">{category.name || category}</span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Barath Men's Wear</h3>
            <p className="footer-address">
              20/5, Kalaiselvi Complex, Near Daily Market Opposite,<br />
              Erode Road, Chennimalai, Erode – 638051,<br />
              Tamil Nadu, India
            </p>
            <p className="footer-landmark">📍 Landmark: Opposite Daily Market, Chennimalai</p>
            <a 
              href="https://www.google.com/maps/place/BARATH+MENS+WEAR/@11.1671346,76.3828903,208239m/data=!3m1!1e3!4m10!1m2!2m1!1sBARATH+MENS+WEAR+Barath+Mens+Wear+Chennimalai+Tamil+Nadu!3m6!1s0x3ba9748698bea09b:0xc0551ece965c0d4e!8m2!3d11.1671346!4d77.6023727!15sCjhCQVJBVEggTUVOUyBXRUFSIEJhcmF0aCBNZW5zIFdlYXIgQ2hlbm5pbWFsYWkgVGFtaWwgTmFkdZIBE21lbnNfY2xvdGhpbmdfc3RvcmXgAQA!16s%2Fg%2F11l6tmjpxt?entry=ttu&g_ep=EgoyMDI2MDEyNi4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-map-link"
            >
              🗺️ View on Google Maps
            </a>
          </div>
          
          <div className="footer-section">
            <h3>Business Info</h3>
            <p><strong>Type:</strong> Men's Clothing & Readymade Garment Retailer</p>
            <p><strong>Products:</strong> Jeans, Shirts, Jackets, T-shirts, Innerwear & more</p>
            <p><strong>Timings:</strong> 9:00 AM – 9:00 PM</p>
          </div>
          
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p><a href="tel:+917502321321" className="footer-phone">📞 +91 75023 21321</a></p>
            <p><a href="tel:+919788092102" className="footer-phone">📞 +91 97880 92102</a></p>
            <p>📧 barathmenwear@gmail.com</p>
            <div className="footer-social">
              <span>Follow us on social media</span>
              <a href="https://www.instagram.com/barath_mens_wear/" target="_blank" rel="noopener noreferrer" className="social-link">
                📷 Instagram
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Barath Men's Wear. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
