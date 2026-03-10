import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import './AdminProductVariants.css';

function AdminProductVariants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('variants');
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [variantForm, setVariantForm] = useState({
    size: '',
    color: '',
    stock: ''
  });
  const [imageForm, setImageForm] = useState({
    url: '',
    alt: '',
    isPrimary: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('file');
  const [editingVariant, setEditingVariant] = useState(null);
  const [editForm, setEditForm] = useState({ size: '', color: '', stock: '' });

  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.product);
      }
    } catch (error) {
      toast.error('Error loading product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Variant Functions
  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.size || !variantForm.color || !variantForm.stock) {
      toast.warning('Please fill all variant fields');
      return;
    }

    try {
      await api.post(`/products/${id}/variants`, {
        size: variantForm.size,
        color: variantForm.color,
        stock: Number(variantForm.stock)
      });
      toast.success('Variant added successfully');
      setVariantForm({ size: '', color: '', stock: '' });
      setShowVariantModal(false);
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding variant');
    }
  };

  const handleEditVariant = (variant) => {
    setEditingVariant(variant._id);
    setEditForm({ size: variant.size, color: variant.color, stock: variant.stock });
  };

  const handleSaveVariant = async (variantId) => {
    try {
      await api.put(`/products/${id}/variants/${variantId}`, {
        size: editForm.size,
        color: editForm.color,
        stock: Number(editForm.stock)
      });
      toast.success('Variant updated successfully');
      setEditingVariant(null);
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating variant');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (window.confirm('Delete this variant?')) {
      try {
        await api.delete(`/products/${id}/variants/${variantId}`);
        toast.success('Variant deleted');
        fetchProduct();
      } catch (error) {
        toast.error('Error deleting variant');
      }
    }
  };

  // Image Functions
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddImage = async (e) => {
    e.preventDefault();

    if (uploadMode === 'file') {
      if (!imageFile) {
        toast.warning('Please select an image file');
        return;
      }
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.post('/upload/product-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const imageUrl = uploadRes.data.imageUrl;
        await api.post(`/products/${id}/images`, {
          url: imageUrl,
          alt: imageForm.alt || imageFile.name,
          isPrimary: imageForm.isPrimary
        });
        toast.success('Image uploaded and added successfully');
        setImageForm({ url: '', alt: '', isPrimary: false });
        setImageFile(null);
        setImagePreview(null);
        setShowImageModal(false);
        fetchProduct();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error uploading image');
      } finally {
        setUploading(false);
      }
    } else {
      if (!imageForm.url) {
        toast.warning('Please provide image URL');
        return;
      }
      try {
        await api.post(`/products/${id}/images`, {
          url: imageForm.url,
          alt: imageForm.alt || '',
          isPrimary: imageForm.isPrimary
        });
        toast.success('Image added successfully');
        setImageForm({ url: '', alt: '', isPrimary: false });
        setShowImageModal(false);
        fetchProduct();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error adding image');
      }
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Delete this image?')) {
      try {
        await api.delete(`/products/${id}/images/${imageId}`);
        toast.success('Image deleted');
        fetchProduct();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting image');
      }
    }
  };

  if (loading) {
    return <div className="loading-page">Loading...</div>;
  }

  if (!product) {
    return <div className="error-page">Product not found</div>;
  }

  return (
    <div className="admin-variants">
      <div className="variant-container">
        <div className="variant-header">
          <button className="back-btn" onClick={() => navigate('/admin/products')}>
            ← Back to Products
          </button>
          <h1>{product.name}</h1>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'variants' ? 'active' : ''}`}
            onClick={() => setActiveTab('variants')}
          >
            Variants ({product.variants?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Images ({product.images?.length || 0})
          </button>
        </div>

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Product Variants</h2>
              <button className="add-btn" onClick={() => setShowVariantModal(true)}>
                + Add Variant
              </button>
            </div>

            {product.variants && product.variants.length > 0 ? (
              <div className="variants-grid">
                {product.variants.map(variant => (
                  <div key={variant._id} className="variant-card">
                    {editingVariant === variant._id ? (
                      <div className="variant-info">
                        <div className="variant-row">
                          <span className="label">Size:</span>
                          <input className="edit-input" value={editForm.size} onChange={(e) => setEditForm({...editForm, size: e.target.value})} />
                        </div>
                        <div className="variant-row">
                          <span className="label">Color:</span>
                          <input className="edit-input" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} />
                        </div>
                        <div className="variant-row">
                          <span className="label">Stock:</span>
                          <input className="edit-input" type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm({...editForm, stock: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button className="add-btn" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => handleSaveVariant(variant._id)}>Save</button>
                          <button className="cancel-btn" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => setEditingVariant(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="variant-info">
                          <div className="variant-row">
                            <span className="label">Size:</span>
                            <span className="value">{variant.size}</span>
                          </div>
                          <div className="variant-row">
                            <span className="label">Color:</span>
                            <div className="color-display">
                              <div
                                className="color-swatch"
                                style={{ backgroundColor: variant.color.toLowerCase() }}
                              />
                              <span className="value">{variant.color}</span>
                            </div>
                          </div>
                          <div className="variant-row">
                            <span className="label">Stock:</span>
                            <span className="value">{variant.stock}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="add-btn" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => handleEditVariant(variant)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDeleteVariant(variant._id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No variants added yet. Add your first variant to start.</p>
              </div>
            )}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Product Images</h2>
              <button className="add-btn" onClick={() => setShowImageModal(true)}>
                + Add Image
              </button>
            </div>

            {product.images && product.images.length > 0 ? (
              <div className="images-grid">
                {product.images.map(image => (
                  <div key={image._id} className="image-card">
                    <div className="image-wrapper">
                      <img src={image.url} alt={image.alt} />
                      {image.isPrimary && (
                        <div className="primary-badge">Primary</div>
                      )}
                    </div>
                    <div className="image-info">
                      <p className="alt-text">{image.alt || 'No description'}</p>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteImage(image._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No images added yet. Add your first image to start.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="modal-overlay" onClick={() => setShowVariantModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Variant</h2>
              <button className="close-btn" onClick={() => setShowVariantModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddVariant} className="variant-form">
              <div className="form-group">
                <label>Size *</label>
                <input
                  type="text"
                  value={variantForm.size}
                  onChange={(e) => setVariantForm({...variantForm, size: e.target.value})}
                  placeholder="e.g., S, M, L, XL"
                />
              </div>
              <div className="form-group">
                <label>Color *</label>
                <input
                  type="text"
                  value={variantForm.color}
                  onChange={(e) => setVariantForm({...variantForm, color: e.target.value})}
                  placeholder="e.g., Red, Blue, Black"
                />
              </div>
              <div className="form-group">
                <label>Stock *</label>
                <input
                  type="number"
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm({...variantForm, stock: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={() => setShowVariantModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="modal-overlay" onClick={() => { setShowImageModal(false); setImageFile(null); setImagePreview(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Image</h2>
              <button className="close-btn" onClick={() => { setShowImageModal(false); setImageFile(null); setImagePreview(null); }}>×</button>
            </div>
            <form onSubmit={handleAddImage} className="variant-form">
              <div className="form-group">
                <label>Upload Method</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                  <button type="button" className={uploadMode === 'file' ? 'submit-btn' : 'cancel-btn'} style={{ flex: 1, padding: '8px' }} onClick={() => setUploadMode('file')}>📁 Upload File</button>
                  <button type="button" className={uploadMode === 'url' ? 'submit-btn' : 'cancel-btn'} style={{ flex: 1, padding: '8px' }} onClick={() => setUploadMode('url')}>🔗 Enter URL</button>
                </div>
              </div>
              {uploadMode === 'file' ? (
                <div className="form-group">
                  <label>Choose Image *</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    style={{ padding: '8px' }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label>Image URL *</label>
                  <input
                    type="url"
                    value={imageForm.url}
                    onChange={(e) => setImageForm({...imageForm, url: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Alt Text</label>
                <input
                  type="text"
                  value={imageForm.alt}
                  onChange={(e) => setImageForm({...imageForm, alt: e.target.value})}
                  placeholder="Image description"
                />
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={imageForm.isPrimary}
                  onChange={(e) => setImageForm({...imageForm, isPrimary: e.target.checked})}
                />
                <label htmlFor="isPrimary">Set as primary image</label>
              </div>
              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={() => { setShowImageModal(false); setImageFile(null); setImagePreview(null); }}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Add Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductVariants;
