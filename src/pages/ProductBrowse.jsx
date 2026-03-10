import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import './ProductBrowse.css';

const API_BASE_URL = 'http://localhost:5000';

// Helper function to get full image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
};

function ProductBrowse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  // Fetch categories and brands on mount
  useEffect(() => {
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

    const fetchBrands = async () => {
      try {
        const response = await api.get('/products/brands');
        if (response.data.success) {
          setBrands(response.data.brands);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };

    fetchCategories();
    fetchBrands();
  }, []);

  // Fetch products function
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', page);
      params.append('limit', 12);

      const response = await api.get(`/products?${params.toString()}`);
      if (response.data.success) {
        setProducts(response.data.products);
        setPagination({
          page: Number(response.data.currentPage) || 1,
          total: response.data.total,
          pages: response.data.pages
        });
      }
    } catch (error) {
      toast.error('Error fetching products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      search: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sort: 'newest'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="product-browse">
      <div className="browse-container">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear All
            </button>
          </div>

          {/* Search */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search products..."
              name="search"
              value={filters.search}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="filter-group">
            <label>Brand</label>
            <select
              name="brand"
              value={filters.brand}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="price-input"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort By</label>
            <select
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          <div className="products-header">
            <h2>Our Products</h2>
            <p className="product-count">
              {loading ? 'Loading...' : `${pagination.total} products found`}
            </p>
          </div>

          {loading ? (
            <div className="loading">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <p>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map(product => (
                  <div
                    key={product._id}
                    className="product-card"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <div className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product.images.find(img => img.isPrimary)?.url || product.images[0].url)}
                          alt={product.name}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                      {product.discount > 0 && (
                        <div className="discount-badge">-{product.discount}%</div>
                      )}
                    </div>
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p className="brand">{product.brand}</p>
                      <div className="price-section">
                        <span className="final-price">₹{product.finalPrice.toFixed(2)}</span>
                        {product.discount > 0 && (
                          <span className="original-price">₹{product.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchProducts(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchProducts(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProductBrowse;
