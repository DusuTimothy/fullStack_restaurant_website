import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook fetching detailed order info and managing status updates in modal.
 */
export const useOrderInspector = ({ orderId, onStatusUpdated }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get(`/orders/${orderId}`);
        if (isMounted && response.data?.data) {
          setOrder(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch order details:', err);
          setError('Failed to load order details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrderDetails();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    if (!order || order.status === newStatus) return;
    setUpdating(true);
    try {
      const response = await axiosClient.patch(`/orders/${order.id}/status`, {
        status: newStatus,
      });
      if (response.data?.data) {
        setOrder(response.data.data);
        if (onStatusUpdated) {
          onStatusUpdated(response.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  return {
    order,
    loading,
    updating,
    error,
    handleStatusChange,
  };
};

export default useOrderInspector;
