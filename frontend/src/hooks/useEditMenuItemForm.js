import { useState, useEffect } from 'react';
import axiosClient, { resolveImageUrl } from '../api/axiosClient';

/**
 * Custom hook managing dish edit form, existing/new image preview, and FormData submission.
 */
export const useEditMenuItemForm = ({ item, categories, onItemUpdated, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // Synchronize form data when item changes
  useEffect(() => {
    if (item) {
      const initialCatId =
        item.categoryId !== undefined && item.categoryId !== null
          ? String(item.categoryId)
          : item.category?.id !== undefined && item.category?.id !== null
          ? String(item.category.id)
          : categories && categories[0]
          ? String(categories[0].id)
          : '';

      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price !== undefined ? String(item.price) : '',
        categoryId: initialCatId,
        isAvailable: item.isAvailable !== undefined ? Boolean(item.isAvailable) : true,
      });
      setImageFile(null);
      setHasNewImage(false);
      setImagePreview(item.imageUrl ? resolveImageUrl(item.imageUrl) : null);
      setErrorMessage(null);
      setErrorDetails([]);
    }
  }, [item, categories]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('File size exceeds 2MB limit');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setHasNewImage(true);
      setErrorMessage(null);
    }
  };

  const handleResetImage = () => {
    setImageFile(null);
    setHasNewImage(false);
    setImagePreview(item?.imageUrl ? resolveImageUrl(item.imageUrl) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item?.id) return;

    setSubmitting(true);
    setErrorMessage(null);
    setErrorDetails([]);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description || '');
      data.append('price', formData.price);
      data.append('categoryId', formData.categoryId || (categories[0] && String(categories[0].id)));
      data.append('isAvailable', formData.isAvailable);

      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await axiosClient.put(`/menu-items/${item.id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        if (onItemUpdated) {
          onItemUpdated(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to update menu item:', err);
      const resData = err.response?.data;
      if (resData?.details) {
        setErrorDetails(resData.details);
      }
      setErrorMessage(resData?.error || 'Failed to update menu item. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    imageFile,
    imagePreview,
    hasNewImage,
    submitting,
    errorDetails,
    errorMessage,
    handleFileChange,
    handleResetImage,
    handleSubmit,
  };
};

export default useEditMenuItemForm;
