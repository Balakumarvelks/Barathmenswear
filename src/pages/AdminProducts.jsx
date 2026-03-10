import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import './AdminProducts.css';

const API_BASE_URL = 'http://localhost:5000';

function AdminProducts() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    category: '',
    brand: '',
    stock: '',
    tags: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products?limit=100');
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      toast.error('Error fetching products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formDataUpload = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('images', files[i]);
    }

    try {
      const response = await api.post('/upload/product-images', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newImages = response.data.images.map((img, index) => ({
          url: img.url,
          alt: '',
          isPrimary: uploadedImages.length === 0 && index === 0
        }));
        setUploadedImages(prev => [...prev, ...newImages]);
        toast.success('Images uploaded successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error uploading images');
      console.error('Error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded image
  const handleRemoveImage = (index) => {
    setUploadedImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index]?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  // Set primary image
  const handleSetPrimary = (index) => {
    setUploadedImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  // Helper function to get full image URL
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.brand || !formData.stock) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        discount: Number(formData.discount) || 0,
        category: formData.category,
        brand: formData.brand,
        stock: Number(formData.stock),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        images: uploadedImages
      };

      let productId;

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, submitData);
        productId = editingProduct._id;
        toast.success('Product updated successfully');
      } else {
        const response = await api.post('/products', submitData);
        productId = response.data.product._id;
        toast.success('Product created successfully');
      }

      // Add images to product if there are new uploads
      if (uploadedImages.length > 0 && !editingProduct) {
        for (const img of uploadedImages) {
          await api.post(`/products/${productId}/images`, {
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary
          });
        }
      }

      handleCloseModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving product');
      console.error('Error:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discount: product.discount || 0,
      category: product.category._id,
      brand: product.brand,
      stock: product.stock,
      tags: (product.tags || []).join(', ')
    });
    setUploadedImages(product.images || []);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Error deleting product');
        console.error('Error:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setUploadedImages([]);
    setFormData({
      name: '',
      description: '',
      price: '',
      discount: '',
      category: '',
      brand: '',
      stock: '',
      tags: ''
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-products">
      <div className="admin-container">
        <div className="page-header">
          <h1>Product Management</h1>
          <button className="add-product-btn" onClick={() => setShowModal(true)}>
            + Add New Product
          </button>
        </div>

        {/* Search */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by product name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-data">
            <p>No products found. Click "Add New Product" to create one.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-name">
                        {product.images && product.images[0] && (
                          <img
                            src={getImageUrl(product.images[0].url)}
                            alt={product.name}
                            className="product-thumb"
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>{product.brand}</td>
                    <td>{product.category?.name || 'N/A'}</td>
                    <td>₹{product.price.toFixed(2)}</td>
                    <td>
                      {product.discount > 0 ? (
                        <span className="discount-badge">{product.discount}%</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`stock-badge ${product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEdit(product)}>
                          Edit
                        </button>
                        <button className="variant-btn" onClick={() => navigate(`/admin/products/${product._id}/variants`)}>
                          Variants
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(product._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              {/* Image Upload Section */}
              <div className="form-group">
                <label>Product Images</label>
                <div className="image-upload-section">
                  <div className="upload-area">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="file-input"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="upload-label">
                      {uploading ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <span className="upload-icon">📷</span>
                          <span>Click to upload images</span>
                          <span className="upload-hint">Max 5MB per image (JPEG, PNG, GIF, WebP)</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="uploaded-images">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className={`uploaded-image ${img.isPrimary ? 'primary' : ''}`}>
                          <img src={getImageUrl(img.url)} alt={`Product ${index + 1}`} />
                          <div className="image-actions">
                            <button
                              type="button"
                              className={`primary-btn ${img.isPrimary ? 'active' : ''}`}
                              onClick={() => handleSetPrimary(index)}
                              title="Set as primary"
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => handleRemoveImage(index)}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                          {img.isPrimary && <span className="primary-label">Primary</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Enter brand name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g. casual, formal, trendy"
                />
              </div>

              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={uploading}>
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
