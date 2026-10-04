import { useState } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook managing dish creation form, image file preview, and FormData submission.
 */
export const useAddMenuItemForm = ({ categories, onItemAdded, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: categories.length > 0 ? categories[0].id : '',
    isAvailable: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('File size exceeds 2MB limit');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setErrorDetails([]);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('categoryId', formData.categoryId || (categories[0] && categories[0].id));
      data.append('isAvailable', formData.isAvailable);

      if (imageFile) {
        data.append('image', imageFile);
      }

      const response = await axiosClient.post('/menu-items', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        if (onItemAdded) {
          onItemAdded(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to create menu item:', err);
      const resData = err.response?.data;
      if (resData?.details) {
        setErrorDetails(resData.details);
      }
      setErrorMessage(resData?.error || 'Failed to create menu item. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    imageFile,
    imagePreview,
    submitting,
    errorDetails,
    errorMessage,
    handleFileChange,
    handleSubmit,
  };
};

export default useAddMenuItemForm;
