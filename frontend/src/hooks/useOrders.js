import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook managing order retrieval, status filtering, and inline updates.
 */
export const useOrders = ({ isAuthenticated, authLoading }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [inspectOrderId, setInspectOrderId] = useState(null);

  const fetchOrders = useCallback(async (isManualRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = statusFilter ? `/orders?status=${statusFilter}` : '/orders';
      const response = await axiosClient.get(url);
      if (response.data?.data) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Unable to load orders. Please check your backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [fetchOrders, isAuthenticated, authLoading]);

  // Quick inline status advancement
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const res = await axiosClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data?.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      const msg = err.response?.data?.error || 'Failed to update order status';
      alert(msg);
    }
  };

  const handleOrderUpdatedInModal = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  };

  // Metrics summary
  const totalRevenue = orders.reduce((acc, o) => acc + parseFloat(o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;

  return {
    orders,
    loading,
    refreshing,
    error,
    statusFilter,
    setStatusFilter,
    inspectOrderId,
    setInspectOrderId,
    fetchOrders,
    handleQuickStatusChange,
    handleOrderUpdatedInModal,
    totalRevenue,
    pendingCount,
    preparingCount,
  };
};

export default useOrders;
