import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import logo from '../assets/logo.png';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.data.success) {
        setSent(true);
        toast.success('Password reset email sent!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="Logo" className="auth-logo" />
          <h2>Forgot Password?</h2>
          <p>Enter your email to reset password</p>
        </div>

        {sent ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Email Sent!</h3>
            <p>Please check your email for password reset instructions.</p>
            <Link to="/login" className="auth-btn">
              <FaArrowLeft /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label><FaEnvelope /> Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p><Link to="/login"><FaArrowLeft /> Back to Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
