import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook managing category creation, inline editing, and deletion.
 */
export const useCategoryManager = ({
  categories,
  onCategoryAdded,
  onCategoryUpdated,
  onCategoryDeleted,
  initialEditingCategoryId = null,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState(initialEditingCategoryId);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [newCategoryData, setNewCategoryData] = useState({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  // If initialEditingCategoryId changes (e.g. from quick-edit on pill), populate it
  useEffect(() => {
    if (initialEditingCategoryId) {
      const found = categories.find((c) => String(c.id) === String(initialEditingCategoryId));
      if (found) {
        setEditingCategoryId(found.id);
        setEditFormData({
          name: found.name,
          description: found.description || '',
        });
        setErrorMessage(null);
        setErrorDetails([]);
      }
    }
  }, [initialEditingCategoryId, categories]);

  const clearMessages = () => {
    setErrorMessage(null);
    setErrorDetails([]);
    setSuccessMessage(null);
  };

  const startEditing = (cat) => {
    clearMessages();
    setEditingCategoryId(cat.id);
    setEditFormData({
      name: cat.name,
      description: cat.description || '',
    });
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditFormData({ name: '', description: '' });
    clearMessages();
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingCategoryId) return;

    if (!editFormData.name.trim()) {
      setErrorMessage('Category name cannot be empty');
      return;
    }

    setSubmitting(true);
    clearMessages();

    try {
      const response = await axiosClient.put(`/categories/${editingCategoryId}`, {
        name: editFormData.name.trim(),
        description: editFormData.description ? editFormData.description.trim() : null,
      });

      if (response.data?.success) {
        if (onCategoryUpdated) {
          onCategoryUpdated(response.data.data);
        }
        setSuccessMessage(`Category "${response.data.data.name}" updated successfully`);
        setEditingCategoryId(null);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      const resData = err.response?.data;
      if (resData?.details) {
        setErrorDetails(resData.details);
      }
      setErrorMessage(resData?.error || 'Failed to update category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryData.name.trim()) {
      setErrorMessage('Category name cannot be empty');
      return;
    }

    setSubmitting(true);
    clearMessages();

    try {
      const response = await axiosClient.post('/categories', {
        name: newCategoryData.name.trim(),
        description: newCategoryData.description ? newCategoryData.description.trim() : null,
      });

      if (response.data?.success) {
        if (onCategoryAdded) {
          onCategoryAdded(response.data.data);
        }
        setSuccessMessage(`Category "${response.data.data.name}" created successfully`);
        setNewCategoryData({ name: '', description: '' });
        setShowAddForm(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      const resData = err.response?.data;
      if (resData?.details) {
        setErrorDetails(resData.details);
      }
      setErrorMessage(resData?.error || 'Failed to create category. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (cat.itemCount > 0) {
      alert(`Cannot delete "${cat.name}". It contains ${cat.itemCount} dish(es). Please delete or reassign them first.`);
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete category "${cat.name}"?`);
    if (!confirmDelete) return;

    setDeletingId(cat.id);
    clearMessages();

    try {
      const response = await axiosClient.delete(`/categories/${cat.id}`);
      if (response.data?.success) {
        if (onCategoryDeleted) {
          onCategoryDeleted(cat.id);
        }
        setSuccessMessage(`Category "${cat.name}" deleted successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      const resData = err.response?.data;
      setErrorMessage(resData?.error || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return {
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
  };
};

export default useCategoryManager;
