import React from 'react';
import { X, Upload, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import useEditMenuItemForm from '../hooks/useEditMenuItemForm';

const EditMenuItemModal = ({ isOpen, onClose, item, categories, onItemUpdated }) => {
  const {
    formData,
    setFormData,
    imagePreview,
    hasNewImage,
    submitting,
    errorDetails,
    errorMessage,
    handleFileChange,
    handleResetImage,
    handleSubmit,
  } = useEditMenuItemForm({ item, categories, onItemUpdated, onClose });

  if (!isOpen || !item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Menu Item</h2>
            <p className="modal-subtitle text-xs text-gray-500 mt-0.5">
              Editing: <span className="font-semibold text-gray-700">{item.name}</span>
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
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
            <label className="form-label" htmlFor="edit-item-name">Dish Name *</label>
            <input
              id="edit-item-name"
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
              <label className="form-label" htmlFor="edit-item-category">Category *</label>
              <select
                id="edit-item-category"
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
              <label className="form-label" htmlFor="edit-item-price">Price ($) *</label>
              <input
                id="edit-item-price"
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
            <label className="form-label" htmlFor="edit-item-description">Description</label>
            <textarea
              id="edit-item-description"
              rows={3}
              className="form-textarea"
              placeholder="Fresh ingredients, culinary style, allergy warnings..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Multer Image Upload & Current Image Preview */}
          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label">Dish Image (JPEG, PNG, WEBP &le; 2MB)</label>
              {hasNewImage && (
                <button
                  type="button"
                  className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium pb-1"
                  onClick={handleResetImage}
                >
                  <RotateCcw size={12} />
                  <span>Revert to original image</span>
                </button>
              )}
            </div>
            <div className="file-upload-box">
              <input
                type="file"
                id="edit-menu-image-upload"
                className="file-input-hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
              <label htmlFor="edit-menu-image-upload" className="file-upload-label">
                {imagePreview ? (
                  <div className="file-preview-wrap">
                    <img src={imagePreview} alt="Preview" className="file-preview-img" />
                    <span>{hasNewImage ? 'New image selected (click to change)' : 'Click to change or replace photo'}</span>
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
              id="edit-isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            />
            <label htmlFor="edit-isAvailable">Available immediately for customer orders</label>
          </div>

          <div className="modal-footer mt-4">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Update Menu Item</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuItemModal;
