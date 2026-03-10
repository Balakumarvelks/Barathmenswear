import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AdminInventory.css';

const API_BASE_URL = 'http://localhost:5000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState({
    type: 'IN',
    quantity: 0,
    reason: '',
    notes: ''
  });
  const [filter, setFilter] = useState({
    search: '',
    stockStatus: ''
  });
  const [lowStockAlert, setLowStockAlert] = useState(10);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [invResponse, prodResponse] = await Promise.all([
        api.get('/admin/inventory'),
        api.get('/products?limit=100')
      ]);
      setInventory(invResponse.data.inventory || []);
      setProducts(prodResponse.data.products || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async () => {
    if (!selectedProduct || stockAction.quantity <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }

    try {
      const response = await api.post('/admin/inventory/update', {
        productId: selectedProduct._id,
        type: stockAction.type,
        quantity: stockAction.quantity,
        reason: stockAction.reason,
        notes: stockAction.notes
      });
      
      // Update local state
      setProducts(products.map(p => 
        p._id === selectedProduct._id 
          ? { ...p, stock: response.data.newStock }
          : p
      ));
      
      toast.success('Stock updated successfully');
      setShowModal(false);
      setStockAction({ type: 'IN', quantity: 0, reason: '', notes: '' });
      setSelectedProduct(null);
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', class: 'out-of-stock' };
    if (stock <= lowStockAlert) return { label: 'Low Stock', class: 'low-stock' };
    return { label: 'In Stock', class: 'in-stock' };
  };

  const filteredProducts = products.filter(product => {
    let match = true;
    
    if (filter.search) {
      match = match && (
        product.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        product.brand.toLowerCase().includes(filter.search.toLowerCase())
      );
    }
    
    if (filter.stockStatus === 'out') {
      match = match && product.stock <= 0;
    } else if (filter.stockStatus === 'low') {
      match = match && product.stock > 0 && product.stock <= lowStockAlert;
    } else if (filter.stockStatus === 'in') {
      match = match && product.stock > lowStockAlert;
    }
    
    return match;
  });

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= lowStockAlert);
  const outOfStockProducts = products.filter(p => p.stock <= 0);

  if (loading) return <div className="admin-loading">Loading inventory...</div>;

  return (
    <div className="admin-inventory">
      <div className="admin-container">
        <div className="page-header">
          <h1>Inventory Management</h1>
          <div className="alert-setting">
            <label>Low Stock Alert Threshold:</label>
            <input
              type="number"
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(Number(e.target.value))}
              min="1"
            />
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="alerts-section">
          {outOfStockProducts.length > 0 && (
            <div className="alert-card critical">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <h4>Out of Stock Alert</h4>
                <p>{outOfStockProducts.length} products are out of stock</p>
                <div className="alert-products">
                  {outOfStockProducts.slice(0, 3).map(p => (
                    <span key={p._id} className="product-tag">{p.name}</span>
                  ))}
                  {outOfStockProducts.length > 3 && (
                    <span className="more-tag">+{outOfStockProducts.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="alert-card warning">
              <div className="alert-icon">📦</div>
              <div className="alert-content">
                <h4>Low Stock Warning</h4>
                <p>{lowStockProducts.length} products have low stock (≤{lowStockAlert})</p>
                <div className="alert-products">
                  {lowStockProducts.slice(0, 3).map(p => (
                    <span key={p._id} className="product-tag">{p.name} ({p.stock})</span>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <span className="more-tag">+{lowStockProducts.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{products.length}</h3>
              <p>Total Products</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <h3>{products.filter(p => p.stock > lowStockAlert).length}</h3>
              <p>In Stock</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <h3>{lowStockProducts.length}</h3>
              <p>Low Stock</p>
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon">✕</div>
            <div className="stat-info">
              <h3>{outOfStockProducts.length}</h3>
              <p>Out of Stock</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="search-input"
          />
          <select
            value={filter.stockStatus}
            onChange={(e) => setFilter({ ...filter, stockStatus: e.target.value })}
          >
            <option value="">All Stock Status</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div className="table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const status = getStockStatus(product.stock);
                return (
                  <tr key={product._id} className={product.stock <= 0 ? 'out-of-stock-row' : ''}>
                    <td>
                      <div className="product-cell">
                        {product.images?.[0] && (
                          <img src={getImageUrl(product.images[0].url)} alt={product.name} className="product-thumb" />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>{product.brand}</td>
                    <td>{product.category?.name || 'N/A'}</td>
                    <td className="stock-cell">
                      <span className={`stock-number ${product.stock <= lowStockAlert ? 'low' : ''}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>₹{product.finalPrice?.toFixed(2)}</td>
                    <td>
                      <button 
                        className="update-stock-btn"
                        onClick={() => openStockModal(product)}
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="no-products">
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Stock</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="product-info-modal">
                <h3>{selectedProduct.name}</h3>
                <p>Current Stock: <strong>{selectedProduct.stock}</strong></p>
              </div>

              <div className="form-group">
                <label>Action Type</label>
                <div className="action-type-buttons">
                  <button
                    type="button"
                    className={`type-btn ${stockAction.type === 'IN' ? 'active in' : ''}`}
                    onClick={() => setStockAction({ ...stockAction, type: 'IN' })}
                  >
                    ➕ Stock In
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${stockAction.type === 'OUT' ? 'active out' : ''}`}
                    onClick={() => setStockAction({ ...stockAction, type: 'OUT' })}
                  >
                    ➖ Stock Out
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={stockAction.quantity}
                  onChange={(e) => setStockAction({ ...stockAction, quantity: Number(e.target.value) })}
                  min="1"
                  placeholder="Enter quantity"
                />
                <p className="preview">
                  New Stock: <strong>
                    {stockAction.type === 'IN' 
                      ? selectedProduct.stock + stockAction.quantity
                      : Math.max(0, selectedProduct.stock - stockAction.quantity)
                    }
                  </strong>
                </p>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <select
                  value={stockAction.reason}
                  onChange={(e) => setStockAction({ ...stockAction, reason: e.target.value })}
                >
                  <option value="">Select reason</option>
                  {stockAction.type === 'IN' ? (
                    <>
                      <option value="PURCHASE">New Purchase</option>
                      <option value="RETURN">Customer Return</option>
                      <option value="ADJUSTMENT">Inventory Adjustment</option>
                    </>
                  ) : (
                    <>
                      <option value="SALE">Sale</option>
                      <option value="DAMAGED">Damaged</option>
                      <option value="LOST">Lost/Missing</option>
                      <option value="ADJUSTMENT">Inventory Adjustment</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={stockAction.notes}
                  onChange={(e) => setStockAction({ ...stockAction, notes: e.target.value })}
                  placeholder="Add any notes..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={updateStock}>
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
