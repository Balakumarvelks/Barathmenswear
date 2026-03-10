import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaTachometerAlt, FaUsers, FaShoppingBag, FaBoxes, FaShoppingCart, FaHeart, FaClipboardList, FaWarehouse, FaTags, FaTicketAlt } from 'react-icons/fa';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, cartCount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Barath Men's Wear" className="logo-img" />
          <span className="logo-text">Barath Men's Wear</span>
        </Link>

        <div className="navbar-menu">
          {user?.role !== 'admin' && (
            <Link to="/products" className="nav-link">
              <FaShoppingBag /> Products
            </Link>
          )}
          {isAuthenticated ? (
            <>
              {user?.role !== 'admin' && (
                <>
                  <Link to="/cart" className="nav-link cart-link">
                    <FaShoppingCart /> Cart
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                  </Link>
                  <Link to="/wishlist" className="nav-link">
                    <FaHeart /> Wishlist
                  </Link>
                  <Link to="/orders" className="nav-link">
                    <FaClipboardList /> Orders
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" className="nav-link">
                    <FaTachometerAlt /> Dashboard
                  </Link>
                  <Link to="/admin/orders" className="nav-link">
                    <FaClipboardList /> Orders
                  </Link>
                  <Link to="/admin/products" className="nav-link">
                    <FaBoxes /> Products
                  </Link>
                  <Link to="/admin/categories" className="nav-link">
                    <FaTags /> Categories
                  </Link>
                  <Link to="/admin/inventory" className="nav-link">
                    <FaWarehouse /> Inventory
                  </Link>
                  <Link to="/admin/coupons" className="nav-link">
                    <FaTicketAlt /> Coupons
                  </Link>
                  <Link to="/admin/users" className="nav-link">
                    <FaUsers /> Users
                  </Link>
                </>
              )}
              <Link to="/profile" className="nav-link">
                <FaUser /> Profile
              </Link>
              <button onClick={handleLogout} className="nav-btn logout-btn">
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-btn register-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
