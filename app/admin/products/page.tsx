'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Package, AlertCircle, Edit, Search, Download, X } from 'lucide-react';
import Image from 'next/image';
import './admin-products.css';
import { FILTERS } from '@/app/components/StoreFilters';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string };
  images?: Array<{ url: string; isPrimary: boolean }>;
  stock: { quantity: number; available: boolean };
  meta?: {
    players?: string;
    duration?: string;
    moods?: string[];
    badges?: string[];
  };
  category?: string[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPlayers, setFilterPlayers] = useState('all');
  const [filterMood, setFilterMood] = useState('all');
  const [filterBadges, setFilterBadges] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product._id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.category?.includes(filterCategory)
      );
    }

    if (filterPlayers !== 'all') {
      filtered = filtered.filter(product => {
        const players = product.meta?.players || '';
        // Simple string matching based on the filter option
        return players.includes(filterPlayers.replace('+', ''));
      });
    }

    if (filterMood !== 'all') {
      filtered = filtered.filter(product =>
        product.meta?.moods?.includes(filterMood)
      );
    }

    if (filterBadges !== 'all') {
      filtered = filtered.filter(product =>
        product.meta?.badges?.some(badge => badge.toLowerCase().includes(filterBadges.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, filterCategory, filterPlayers, filterMood, filterBadges, products]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      setProducts(data.items || []);
      setFilteredProducts(data.items || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `⚠️ DELETE PRODUCT\n\nAre you sure you want to delete:\n"${name}"\n\nThis action cannot be undone!`
    );

    if (!confirmed) return;
    setDeleting(id);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Product deleted successfully!');
        setProducts(prev => prev.filter(p => p._id !== id));
        setSelectedProducts(prev => prev.filter(p => p !== id));
      } else {
        alert(`❌ Failed to delete product\n\n${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during delete:', error);
      alert('❌ Error deleting product. Check console for details.');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    const confirmed = window.confirm(
      `⚠️ BULK DELETE\n\nDelete ${selectedProducts.length} products?\n\nThis cannot be undone!`
    );

    if (!confirmed) return;

    for (const id of selectedProducts) {
      const product = products.find(p => p._id === id);
      if (product) {
        await handleDelete(id, product.name);
      }
    }
    setSelectedProducts([]);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getPrimaryImage = (product: Product): string => {
    const primaryImage = product.images?.find((img) => img.isPrimary)?.url;
    if (primaryImage) return primaryImage;
    if (product.images && product.images.length > 0) return product.images[0].url;
    return product.media?.thumbnail || '/placeholder-image.jpg';
  };

  const getStockStatus = (product: Product) => {
    if (!product.stock.available || product.stock.quantity === 0) {
      return {
        label: 'Out of Stock',
        className: 'stock-badge stock-out'
      };
    }
    if (product.stock.quantity <= 5) {
      return {
        label: `Critical (${product.stock.quantity})`,
        className: 'stock-badge stock-critical'
      };
    }
    if (product.stock.quantity <= 20) {
      return {
        label: `Low (${product.stock.quantity})`,
        className: 'stock-badge stock-low'
      };
    }
    return {
      label: `${product.stock.quantity} units`,
      className: 'stock-badge stock-good'
    };
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Price', 'Stock', 'Players', 'Category'];
    const rows = filteredProducts.map(p => [
      p._id,
      p.name,
      p.price.amount,
      p.stock.quantity,
      p.meta?.players || 'N/A',
      p.category?.[0] || 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="admin-products-page">
      <div className="content-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/admin" className="breadcrumb-link">Dashboard</Link>
          <span>/</span>
          <span className="breadcrumb-current">Products</span>
        </div>

        {/* Header Card */}
        <div className="header-card">
          <div className="title-section">
            <h1 className="page-title">Products</h1>
            <p className="product-count">
              {filteredProducts.length} of {products.length} total
            </p>
          </div>

          <div className="search-actions-container">
            {/* Search & Filters */}
            <div className="filters-row">
              {/* Search Bar */}
              <div className="search-container">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="search-clear"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              {/* Category Filter (Occasion) */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Occasions</option>
                {FILTERS.occasion.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Export CSV */}
              <button
                onClick={exportToCSV}
                className="btn btn-export"
              >
                <Download size={16} />
                <span className="hidden-sm">Export</span>
              </button>

              {/* Add Product */}
              <Link
                href="/admin/products/new"
                className="btn btn-add"
              >
                <Plus size={18} />
                Add Product
              </Link>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="quick-filters">
            <span className="filter-label">Quick Filters:</span>

            {/* Players Filter */}
            <select
              value={filterPlayers}
              onChange={(e) => setFilterPlayers(e.target.value)}
              className="filter-chip filter-chip-players"
            >
              <option value="all">👥 All Players</option>
              {FILTERS.players.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Mood Filter */}
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value)}
              className="filter-chip filter-chip-mood"
            >
              <option value="all">😊 All Moods</option>
              {FILTERS.mood.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Badges Filter */}
            <select
              value={filterBadges}
              onChange={(e) => setFilterBadges(e.target.value)}
              className="filter-chip filter-chip-occasion"
            >
              <option value="all">🏆 All Badges</option>
              <option value="bestseller">🏆 Bestseller</option>
              <option value="new">✨ New Release</option>
              <option value="trending">🔥 Trending</option>
              <option value="limited">⏳ Limited</option>
            </select>

            {/* Stock Status Chips */}
            <button
              onClick={() => {
                const criticalProducts = products.filter(p => p.stock.quantity <= 5 && p.stock.quantity > 0);
                setFilteredProducts(criticalProducts);
              }}
              className="filter-chip filter-chip-stock"
            >
              🚨 Critical Stock ({products.filter(p => p.stock.quantity <= 5 && p.stock.quantity > 0).length})
            </button>

            <button
              onClick={() => {
                const lowStockProducts = products.filter(p => p.stock.quantity > 5 && p.stock.quantity <= 20);
                setFilteredProducts(lowStockProducts);
              }}
              className="filter-chip filter-chip-stock"
            >
              ⚠️ Low Stock ({products.filter(p => p.stock.quantity > 5 && p.stock.quantity <= 20).length})
            </button>

            {/* Clear All Filters */}
            {(filterCategory !== 'all' || filterPlayers !== 'all' || filterMood !== 'all' || filterBadges !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterCategory('all');
                  setFilterPlayers('all');
                  setFilterMood('all');
                  setFilterBadges('all');
                  setSearchQuery('');
                  setFilteredProducts(products);
                }}
                className="filter-chip filter-chip-clear"
              >
                ✕ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="table-container">
          {filteredProducts.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="checkbox"
                      />
                    </th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Players</th>
                    <th>Stock Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredProducts.map((product) => {
                    const primaryImageUrl = getPrimaryImage(product);
                    const imageCount = product.images?.length || 0;
                    const stockStatus = getStockStatus(product);

                    return (
                      <tr key={product._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => toggleSelectProduct(product._id)}
                            className="checkbox"
                          />
                        </td>
                        <td>
                          <div className="product-info">
                            <div className="product-image">
                              <Image
                                src={primaryImageUrl}
                                alt={product.name}
                                fill
                                className="product-img"
                                unoptimized
                              />
                              {imageCount > 1 && (
                                <div className="image-badge">
                                  +{imageCount - 1}
                                </div>
                              )}
                            </div>
                            <div className="product-details">
                              <p className="product-name">{product.name}</p>
                              <div className="product-meta">
                                <p className="product-id">{product._id.slice(-8)}</p>
                                {imageCount > 0 && (
                                  <span className="image-count">
                                    📸 {imageCount}
                                  </span>
                                )}
                              </div>
                              {!product.slug && (
                                <p className="warning-badge">
                                  <AlertCircle size={10} />
                                  No slug
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="price">
                            {product.price.currency === 'INR' ? '₹' : '$'}{product.price.amount.toLocaleString()}
                          </div>
                        </td>
                        <td>
                          {product.meta?.players || 'N/A'}
                        </td>
                        <td>
                          <span className={stockStatus.className}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            {/* Edit Button */}
                            <Link
                              href={`/admin/products/${product._id}/edit`}
                              className="action-btn action-btn-edit"
                              title="Edit product"
                            >
                              <Edit size={18} className="action-icon" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() => handleDelete(product._id, product.name)}
                              disabled={deleting === product._id}
                              title="Delete product"
                            >
                              {deleting === product._id ? (
                                <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                              ) : (
                                <Trash2 size={18} className="action-icon" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Package size={64} className="empty-icon" />
              <p className="empty-title">No products found</p>
              <p className="empty-message">
                {searchQuery || filterCategory !== 'all' || filterPlayers !== 'all' || filterMood !== 'all' || filterBadges !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first product'}
              </p>
              {(searchQuery || filterCategory !== 'all' || filterPlayers !== 'all' || filterMood !== 'all' || filterBadges !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCategory('all');
                    setFilterPlayers('all');
                    setFilterMood('all');
                    setFilterBadges('all');
                    setFilteredProducts(products);
                  }}
                  className="btn btn-export"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedProducts.length > 0 && (
          <div className="bulk-action-bar">
            <div className="bulk-count">
              <div className="count-badge">
                {selectedProducts.length}
              </div>
              <span className="count-text">
                {selectedProducts.length} selected
              </span>
            </div>

            <div className="divider"></div>

            <div className="bulk-actions">
              <button
                onClick={handleBulkDelete}
                className="btn btn-bulk-delete"
              >
                <Trash2 size={16} />
                Delete All
              </button>

              <button
                onClick={() => setSelectedProducts([])}
                className="btn btn-bulk-cancel"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}