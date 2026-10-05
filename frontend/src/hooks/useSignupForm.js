import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook managing signup form data, client validation, and submission.
 */
export const useSignupForm = (redirectUrl = '/') => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setErrorDetails([]);

    try {
      await signup(formData);
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      console.error('Signup failed:', err);
      const resData = err.response?.data;
      if (resData?.details && Array.isArray(resData.details)) {
        setErrorDetails(resData.details);
      }
      setErrorMessage(resData?.error || err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    showPassword,
    setShowPassword,
    loading,
    errorMessage,
    errorDetails,
    handleChange,
    handleRoleSelect,
    handleSubmit,
  };
};

export default useSignupForm;
