import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaSave } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfileData({
        ...profileData,
        address: { ...profileData.address, [addressField]: value }
      });
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (result.success) {
        toast.success('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FaUser /> Profile Info
        </button>
        <button
          className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <FaLock /> Change Password
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-section">
              <h3><FaUser /> Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaEnvelope /> Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label><FaPhone /> Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><FaMapMarkerAlt /> Address</h3>
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={profileData.address.street}
                  onChange={handleProfileChange}
                  placeholder="Enter street address"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={profileData.address.city}
                    onChange={handleProfileChange}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={profileData.address.state}
                    onChange={handleProfileChange}
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={profileData.address.pincode}
                    onChange={handleProfileChange}
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="save-btn" disabled={loading}>
              <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-section">
              <h3><FaLock /> Change Password</h3>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="save-btn" disabled={loading}>
              <FaLock /> {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
