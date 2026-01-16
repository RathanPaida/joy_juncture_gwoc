'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import './new-product.css';
import { FILTERS } from '@/app/components/StoreFilters';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    currency: 'INR',
    stock: '',
    category: 'party', // Default to first occasion or generic
    gametype: 'board-game',
    players: '',
    duration: '',
    moods: [] as string[],
    badges: [] as string[],
  });

  // Auto-generate slug from name and check for duplicates
  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setFormData(prev => ({ ...prev, name, slug }));
    setNameError('');

    // Check if product with this name already exists (debounced)
    if (name.trim().length > 2) {
      setCheckingName(true);

      // Debounce the API call
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/admin/products/check-name?name=${encodeURIComponent(name)}`);
          const data = await res.json();

          if (data.exists) {
            setNameError(`⚠️ A product with the name "${name}" already exists!`);
          } else {
            setNameError('');
          }
        } catch (error) {
          console.error('Error checking product name:', error);
        } finally {
          setCheckingName(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    addFiles(Array.from(files));
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  };

  // Add files to state
  const addFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please select only image files');
      return;
    }

    const newImages: ImageFile[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0,
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  // Set primary image
  const setPrimaryImage = (id: string) => {
    setImages(prev =>
      prev.map(img => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  // Handle mood selection
  const toggleMood = (mood: string) => {
    setFormData(prev => ({
      ...prev,
      moods: prev.moods.includes(mood)
        ? prev.moods.filter(m => m !== mood)
        : [...prev.moods, mood],
    }));
  };

  // Handle badge selection
  const toggleBadge = (badge: string) => {
    setFormData(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge],
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nameError) {
      alert('❌ Cannot create product: A product with this name already exists!');
      return;
    }

    if (images.length === 0) {
      alert('Please add at least one product image');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();

      submitData.append('name', formData.name);
      submitData.append('slug', formData.slug);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('currency', formData.currency);
      submitData.append('stock', formData.stock);
      submitData.append('category', formData.category);
      submitData.append('gametype', formData.gametype);
      submitData.append('players', formData.players);
      submitData.append('duration', formData.duration);
      submitData.append('moods', JSON.stringify(formData.moods));
      submitData.append('badges', JSON.stringify(formData.badges));

      images.forEach((img, index) => {
        submitData.append('images', img.file);
        if (img.isPrimary) {
          submitData.append('primaryImageIndex', index.toString());
        }
      });

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        body: submitData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Product created successfully!');
        router.push('/admin/products');
      } else {
        alert(`❌ Failed to create product\n\n${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('❌ Error creating product. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-product-page">
      <div className="new-product-container">
        {/* Header */}
        <div className="new-product-header">
          <Link href="/admin/products" className="back-link">
            <ArrowLeft size={20} />
            Back to Products
          </Link>
          <h1 className="page-title">Add New Product</h1>
          <p className="page-subtitle">Fill in the details to create a new product</p>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {/* Image Upload Section */}
          <div className="form-section">
            <h2 className="section-title">
              <ImageIcon size={20} />
              Product Images
            </h2>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            >
              <Upload size={48} className="upload-icon" />
              <p className="upload-text">
                Drag and drop images here, or click to select
              </p>
              <p className="upload-subtext">
                Supports: JPG, PNG, WebP (Max 5MB each)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="upload-button">
                Select Images
              </label>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="preview-section">
                <p className="preview-info">
                  {images.length} image{images.length !== 1 ? 's' : ''} uploaded. Click to set as primary.
                </p>
                <div className="image-grid">
                  {images.map(img => (
                    <div
                      key={img.id}
                      className={`image-card ${img.isPrimary ? 'primary' : ''}`}
                      onClick={() => setPrimaryImage(img.id)}
                    >
                      <div className="image-wrapper">
                        <Image
                          src={img.preview}
                          alt="Preview"
                          fill
                          className="preview-image"
                          unoptimized
                        />
                      </div>

                      {img.isPrimary && (
                        <div className="primary-badge">
                          <CheckCircle size={12} />
                          Primary
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        className="remove-button"
                      >
                        <X size={16} />
                      </button>

                      <div className="image-name">
                        {img.file.name.length > 20
                          ? img.file.name.substring(0, 20) + '...'
                          : img.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Product Name *</label>
                <div className="input-with-validation">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className={`form-input ${nameError ? 'error' : ''}`}
                    placeholder="e.g., Catan"
                  />
                  {checkingName && (
                    <span className="checking-indicator">Checking...</span>
                  )}
                </div>
                {nameError && (
                  <p className="error-message">{nameError}</p>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., catan"
                />
                <p className="form-hint">Auto-generated from name, but you can customize</p>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="form-textarea"
                  placeholder="Describe the product..."
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="form-section">
            <h2 className="section-title">Pricing & Stock</h2>
            <div className="form-grid grid-3">
              <div className="form-group">
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency *</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="form-select"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="form-input"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="form-section">
            <h2 className="section-title">Product Details</h2>
            <div className="form-grid grid-3">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select"
                >
                  <option value="" disabled>Select Occasion</option>
                  {FILTERS.occasion.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gametype *</label>
                <select
                  value={formData.gametype}
                  onChange={(e) => setFormData(prev => ({ ...prev, gametype: e.target.value }))}
                  className="form-select"
                >
                  <option value="board-game">Board Game</option>
                  <option value="card-game">Card Game</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Players</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.players}
                    onChange={(e) => setFormData(prev => ({ ...prev, players: e.target.value }))}
                    className="form-input"
                    placeholder="e.g., 2-4"
                  />
                  <div className="flex flex-wrap gap-2">
                    {FILTERS.players.options.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, players: opt }))}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., 30-60 min"
                />
              </div>
            </div>

            {/* Moods */}
            <div className="form-group full-width">
              <label className="form-label">Moods</label>
              <div className="tag-group">
                {FILTERS.mood.options.map(mood => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleMood(mood)}
                    className={`tag-button ${formData.moods.includes(mood) ? 'active' : ''}`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="form-group full-width">
              <label className="form-label">Badges</label>
              <div className="tag-group">
                {['bestseller', 'new', 'trending', 'limited'].map(badge => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => toggleBadge(badge)}
                    className={`tag-button badge ${formData.badges.includes(badge) ? 'active' : ''}`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <Link href="/admin/products" className="btn-cancel">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || checkingName || !!nameError}
              className="btn-submit"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}