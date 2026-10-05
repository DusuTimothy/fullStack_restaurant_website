import React from 'react';
import { X, Plus, Pencil, Trash2, Check, AlertCircle, CheckCircle2, Loader2, Layers } from 'lucide-react';
import useCategoryManager from '../hooks/useCategoryManager';

const ManageCategoriesModal = ({
  isOpen,
  onClose,
  categories,
  onCategoryAdded,
  onCategoryUpdated,
  onCategoryDeleted,
  initialEditingCategoryId,
}) => {
  const {
    editingCategoryId,
    editFormData,
    setEditFormData,
    newCategoryData,
    setNewCategoryData,
    showAddForm,
    setShowAddForm,
    submitting,
    deletingId,
    errorMessage,
    errorDetails,
    successMessage,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleCreateCategory,
    handleDeleteCategory,
  } = useCategoryManager({
    categories,
    onCategoryAdded,
    onCategoryUpdated,
    onCategoryDeleted,
    initialEditingCategoryId,
  });

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="modal-title">Manage Categories</h2>
              <p className="modal-subtitle text-xs text-gray-500 mt-0.5">
                Organize menu items with categories. Edit names, descriptions, or add new sections.
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

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

          {/* Add Category Section */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            {!showAddForm ? (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Add New Category</h4>
                  <p className="text-xs text-slate-500">Create a new section for your restaurant menu</p>
                </div>
                <button
                  type="button"
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus size={14} />
                  <span>New Category</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800">New Category Details</h4>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCategoryData({ name: '', description: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs" htmlFor="new-cat-name">Category Name *</label>
                    <input
                      id="new-cat-name"
                      type="text"
                      required
                      placeholder="e.g., Artisan Cocktails"
                      className="form-input text-sm py-1.5"
                      value={newCategoryData.name}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs" htmlFor="new-cat-desc">Description (Optional)</label>
                    <input
                      id="new-cat-desc"
                      type="text"
                      placeholder="e.g., Handcrafted signature drinks"
                      className="form-input text-sm py-1.5"
                      value={newCategoryData.description}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-secondary text-xs py-1 px-3"
                    onClick={() => setShowAddForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    <span>Save Category</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Existing Categories List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Existing Categories ({categories.length})
              </h3>
            </div>

            <div className="category-manager-list space-y-2">
              {categories.map((cat) => {
                const isEditingThis = editingCategoryId === cat.id;

                if (isEditingThis) {
                  return (
                    <form
                      key={cat.id}
                      onSubmit={handleSaveEdit}
                      className="p-3 border-2 border-amber-400 bg-amber-50/50 rounded-lg space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          Editing Category #{cat.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="btn-secondary text-xs py-1 px-2.5"
                            onClick={cancelEditing}
                            disabled={submitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1 bg-amber-600 hover:bg-amber-700"
                            disabled={submitting}
                          >
                            {submitting ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="form-label text-xs" htmlFor={`edit-cat-name-${cat.id}`}>
                            Category Name *
                          </label>
                          <input
                            id={`edit-cat-name-${cat.id}`}
                            type="text"
                            required
                            className="form-input text-sm py-1.5 bg-white"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="form-label text-xs" htmlFor={`edit-cat-desc-${cat.id}`}>
                            Description
                          </label>
                          <input
                            id={`edit-cat-desc-${cat.id}`}
                            type="text"
                            className="form-input text-sm py-1.5 bg-white"
                            placeholder="Category description..."
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          />
                        </div>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 border border-slate-200 bg-white rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
                        <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {cat.itemCount !== undefined
                            ? `${cat.itemCount} dish${cat.itemCount === 1 ? '' : 'es'}`
                            : 'Category'}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{cat.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded border border-slate-200 transition-colors"
                        onClick={() => startEditing(cat)}
                        title={`Edit "${cat.name}"`}
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        className={`p-1.5 rounded border transition-colors ${
                          cat.itemCount > 0
                            ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                        }`}
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={deletingId === cat.id || cat.itemCount > 0}
                        title={
                          cat.itemCount > 0
                            ? `Cannot delete "${cat.name}" because it contains ${cat.itemCount} dishes`
                            : `Delete category "${cat.name}"`
                        }
                        aria-label={`Delete ${cat.name}`}
                      >
                        {deletingId === cat.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageCategoriesModal;
