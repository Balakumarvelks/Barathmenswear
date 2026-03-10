import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaShieldAlt } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}!</h1>
        <p>Here's your account overview</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card profile-card">
          <div className="card-header">
            <FaUser className="card-icon" />
            <h3>Profile Information</h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <FaUser />
              <span><strong>Name:</strong> {user?.firstName} {user?.lastName}</span>
            </div>
            <div className="info-row">
              <FaEnvelope />
              <span><strong>Email:</strong> {user?.email}</span>
            </div>
            <div className="info-row">
              <FaPhone />
              <span><strong>Phone:</strong> {user?.phone}</span>
            </div>
            <div className="info-row">
              <FaShieldAlt />
              <span><strong>Role:</strong> <span className={`role-badge ${user?.role}`}>{user?.role}</span></span>
            </div>
            <div className="info-row">
              <FaCalendar />
              <span><strong>Member Since:</strong> {formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card welcome-card">
          <div className="welcome-content">
            <h2>Barath Men's Wear</h2>
            <p>Your one-stop destination for premium men's fashion</p>
            <div className="features-list">
              <div className="feature-item">✓ Quality Products</div>
              <div className="feature-item">✓ Best Prices</div>
              <div className="feature-item">✓ Fast Delivery</div>
              <div className="feature-item">✓ Easy Returns</div>
            </div>
          </div>
        </div>

        <div className="dashboard-card quick-actions">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="actions-grid">
            <a href="/profile" className="action-btn">
              <FaUser /> Edit Profile
            </a>
            <a href="/profile" className="action-btn">
              <FaShieldAlt /> Change Password
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
