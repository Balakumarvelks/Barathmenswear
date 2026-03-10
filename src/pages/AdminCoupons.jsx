import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AdminCoupons.css';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    perUserLimit: '1',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coupons/admin/all');
      setCoupons(response.data.coupons);
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        code: formData.code,
        name: formData.name || formData.code,
        description: formData.description,
        type: 'PERCENTAGE',
        value: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: Number(formData.maxDiscount) || null,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        usageLimit: Number(formData.usageLimit) || null,
        perUserLimit: Number(formData.perUserLimit) || 1,
        isActive: formData.isActive
      };

      if (editingCoupon) {
        const response = await api.put(`/coupons/${editingCoupon._id}`, data);
        setCoupons(coupons.map(c => c._id === editingCoupon._id ? response.data.coupon : c));
        toast.success('Coupon updated successfully');
      } else {
        const response = await api.post('/coupons', data);
        setCoupons([...coupons, response.data.coupon]);
        toast.success('Coupon created successfully');
      }
      
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name || '',
      description: coupon.description || '',
      discountType: coupon.type || coupon.discountType,
      discountValue: coupon.value || coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscount: coupon.maxDiscount || '',
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      usageLimit: coupon.usageLimit || '',
      perUserLimit: coupon.perUserLimit || '1',
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(coupons.filter(c => c._id !== id));
      toast.success('Coupon deleted successfully');
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      const response = await api.put(`/coupons/${coupon._id}`, {
        isActive: !coupon.isActive
      });
      setCoupons(coupons.map(c => c._id === coupon._id ? response.data.coupon : c));
      toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '',
      maxDiscount: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      perUserLimit: '1',
      isActive: true
    });
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  if (loading) return <div className="admin-loading">Loading coupons...</div>;

  return (
    <div className="admin-coupons">
      <div className="admin-container">
        <div className="page-header">
          <h1>Coupon Management</h1>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Create Coupon
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">{coupons.length}</span>
            <span className="stat-label">Total Coupons</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{coupons.filter(c => c.isActive).length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}</span>
            <span className="stat-label">Total Uses</span>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="table-wrapper">
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Valid Until</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon._id} className={!coupon.isActive || isExpired(coupon.validUntil) ? 'inactive-row' : ''}>
                  <td>
                    <div className="coupon-code-cell">
                      <span className="coupon-code">{coupon.code}</span>
                      {coupon.description && (
                        <span className="coupon-desc">{coupon.description}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="discount-value">
                      {`${coupon.value}%`}
                    </span>
                    {coupon.maxDiscount && (
                      <span className="max-discount">Max: ₹{coupon.maxDiscount}</span>
                    )}
                  </td>
                  <td>₹{coupon.minOrderAmount || 0}</td>
                  <td>
                    <span className={isExpired(coupon.validUntil) ? 'expired' : ''}>
                      {new Date(coupon.validUntil).toLocaleDateString()}
                    </span>
                    {isExpired(coupon.validUntil) && (
                      <span className="expired-badge">Expired</span>
                    )}
                  </td>
                  <td>
                    {coupon.usedCount || 0}
                    {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={coupon.isActive}
                        onChange={() => toggleCouponStatus(coupon)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => handleEdit(coupon)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(coupon._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {coupons.length === 0 && (
          <div className="no-coupons">
            <p>No coupons found. Create your first coupon!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="coupon-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., SAVE20"
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Coupon Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer Sale Discount"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Get 20% off on your order"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Value (%) *</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder="e.g., 20"
                    required
                    min="1"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Order Amount</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Maximum Discount (₹)</label>
                <input
                  type="number"
                  name="maxDiscount"
                  value={formData.maxDiscount}
                  onChange={handleInputChange}
                  placeholder="e.g., 200"
                  min="0"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valid From *</label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Valid Until *</label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Per User Limit</label>
                  <input
                    type="number"
                    name="perUserLimit"
                    value={formData.perUserLimit}
                    onChange={handleInputChange}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
