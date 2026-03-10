import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './AdminCategories.css';

const getImageUrl = (url) => {
  if (!url) return null;
  return url;
};

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      toast.error('Error fetching categories');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      setUploading(true);
      const response = await api.post('/upload/category-image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, image: response.data.imageUrl }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.warning('Please enter category name');
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description || '',
        image: formData.image || null
      };

      if (editingCategory) {
        await api.put(`/products/categories/${editingCategory._id}`, submitData);
        toast.success('Category updated successfully');
      } else {
        await api.post('/products/categories', submitData);
        toast.success('Category created successfully');
      }

      setShowModal(false);
      setFormData({ name: '', description: '', image: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving category');
      console.error('Error:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/products/categories/${id}`);
        toast.success('Category deleted successfully');
        fetchCategories();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting category');
        console.error('Error:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', image: '' });
  };

  return (
    <div className="admin-categories">
      <div className="admin-container">
        <div className="page-header">
          <h1>Category Management</h1>
          <button className="add-category-btn" onClick={() => setShowModal(true)}>
            + Add New Category
          </button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="loading">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="no-data">
            <p>No categories found. Click "Add New Category" to create one.</p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map(category => (
              <div key={category._id} className="category-card">
                {category.image && category.image.startsWith('http') && (
                  <div className="category-image" onClick={() => setLightboxImage({ src: getImageUrl(category.image), alt: category.name })}>
                    <img
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="image-view-hint">
                      <span>🔍 Click to view</span>
                    </div>
                  </div>
                )}
                <div className="category-content">
                  <h3>{category.name}</h3>
                  {category.description && (
                    <p className="description">{category.description}</p>
                  )}
                  <div className="card-actions">
                    <button className="edit-btn" onClick={() => handleEdit(category)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(category._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter category description"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <p className="upload-status">Uploading...</p>}
                {formData.image && (
                  <div className="image-preview">
                    <img src={formData.image} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage.src} alt={lightboxImage.alt} />
            <p className="lightbox-caption">{lightboxImage.alt}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
