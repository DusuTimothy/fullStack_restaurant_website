import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook handling cart checkout and order placement.
 */
export const useCartCheckout = ({ cart, orderNotes, clearCart, closeCart, isAuthenticated }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handleSubmitOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cart.length === 0) return;

    if (!isAuthenticated) {
      setErrorMessage('Please sign in or create an account to place this order.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setOrderSuccess(null);

    try {
      const payload = {
        notes: orderNotes ? orderNotes.trim() : undefined,
        items: cart.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      };

      const response = await axiosClient.post('/orders', payload);

      if (response.data?.success) {
        const createdOrder = response.data.data;
        setOrderSuccess(createdOrder);
        clearCart();
      }
    } catch (err) {
      console.error('Order submission error:', err);
      const apiError =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Failed to submit order. Please try again.';
      setErrorMessage(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToOrders = () => {
    closeCart();
    setOrderSuccess(null);
    navigate('/orders');
  };

  const handleDismissSuccess = () => {
    setOrderSuccess(null);
    closeCart();
  };

  return {
    submitting,
    errorMessage,
    orderSuccess,
    handleSubmitOrder,
    handleGoToOrders,
    handleDismissSuccess,
  };
};

export default useCartCheckout;
