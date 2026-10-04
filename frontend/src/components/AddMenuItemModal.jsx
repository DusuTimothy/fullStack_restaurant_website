import React from 'react';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';
import useAddMenuItemForm from '../hooks/useAddMenuItemForm';

const AddMenuItemModal = ({ isOpen, onClose, categories, onItemAdded }) => {
  const {
    formData,
    setFormData,
    imagePreview,
    submitting,
    errorDetails,
    errorMessage,
    handleFileChange,
    handleSubmit,
  } = useAddMenuItemForm({ categories, onItemAdded, onClose });

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Menu Item</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMessage && (
            <div className="modal-error-banner">
              <AlertCircle size={18} />
              <div>
                <strong>{errorMessage}</strong>
                {errorDetails.length > 0 && (
                  <ul className="text-xs list-disc list-inside mt-1">
                    {errorDetails.map((d, i) => (
                      <li key={i}>{d.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="item-name">Dish Name *</label>
            <input
              id="item-name"
              type="text"
              required
              className="form-input"
              placeholder="e.g., Crispy Salmon Tartare"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="item-category">Category *</label>
              <select
                id="item-category"
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="item-price">Price ($) *</label>
              <input
                id="item-price"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="form-input"
                placeholder="18.50"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="item-description">Description</label>
            <textarea
              id="item-description"
              rows={3}
              className="form-textarea"
              placeholder="Fresh ingredients, culinary style, allergy warnings..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Multer Image Upload */}
          <div className="form-group">
            <label className="form-label">Dish Image (Multer: JPEG, PNG, WEBP &le; 2MB)</label>
            <div className="file-upload-box">
              <input
                type="file"
                id="menu-image-upload"
                className="file-input-hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
              <label htmlFor="menu-image-upload" className="file-upload-label">
                {imagePreview ? (
                  <div className="file-preview-wrap">
                    <img src={imagePreview} alt="Preview" className="file-preview-img" />
                    <span>Click to change image</span>
                  </div>
                ) : (
                  <div className="file-upload-placeholder">
                    <Upload size={28} className="text-gray-400" />
                    <span className="font-semibold text-sm">Click to upload photo</span>
                    <span className="text-xs text-gray-500">Max file size: 2MB</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            />
            <label htmlFor="isAvailable">Available immediately for customer orders</label>
          </div>

          <div className="modal-footer mt-4">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading & Saving...</span>
                </>
              ) : (
                <span>Save Menu Item</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMenuItemModal;
