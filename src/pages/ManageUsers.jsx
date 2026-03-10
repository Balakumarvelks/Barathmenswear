import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, 
  FaTimes, FaUser, FaEnvelope, FaPhone, FaUserShield 
} from 'react-icons/fa';
import './ManageUsers.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      const response = await adminService.getUsers(currentPage, 10);
      setUsers(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'customer'
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await adminService.createUser(formData);
        toast.success('User created successfully!');
      } else {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await adminService.updateUser(selectedUser._id, updateData);
        toast.success('User updated successfully!');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      toast.success('User status updated!');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        toast.success('User deleted successfully!');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="manage-users">
      <div className="page-header">
        <div className="header-left">
          <h1>Manage Users</h1>
          <p>View and manage all users</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <FaPlus /> Add User
        </button>
      </div>

      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="user-name">
                    <div className="avatar">{user.firstName[0]}{user.lastName[0]}</div>
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn edit" 
                      onClick={() => openEditModal(user)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn toggle" 
                      onClick={() => handleToggleStatus(user._id)}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => handleDelete(user._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Add New User' : 'Edit User'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label><FaUser /> First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label><FaUser /> Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label><FaEnvelope /> Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  disabled={modalMode === 'edit'}
                />
              </div>
              <div className="form-group">
                <label><FaPhone /> Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <div className="form-group">
                <label><FaUserShield /> Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password {modalMode === 'edit' && '(leave blank to keep current)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required={modalMode === 'create'}
                  placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : 'Min 6 characters'}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {modalMode === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
