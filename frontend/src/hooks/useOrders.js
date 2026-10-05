import { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook managing order retrieval, status filtering, and inline updates.
 * Guarantees that orders are isolated per authenticated user, stales/in-flight
 * responses from earlier accounts are discarded, and UI state clears on logout/account switch.
 */
export const useOrders = ({ isAuthenticated, authLoading, user } = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [inspectOrderId, setInspectOrderId] = useState(null);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const currentUserId = user?.id || null;
  const prevUserIdRef = useRef(currentUserId);

  const fetchOrders = useCallback(
    async (isManualRefresh = false) => {
      // If unauthenticated or no valid user, clear state and abort any active request
      if (!isAuthenticated || !currentUserId) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setOrders([]);
        setError(null);
        setInspectOrderId(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Abort any earlier in-flight request so it cannot overwrite the current response
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const requestId = ++activeRequestIdRef.current;
      const requestUserId = currentUserId;

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        // Clear previous account's orders while new account's orders are loading
        setOrders([]);
      }
      setError(null);

      try {
        const url = statusFilter ? `/orders?status=${statusFilter}` : '/orders';
        const response = await axiosClient.get(url, { signal: controller.signal });

        // Guard: Only update state if this request is still active and user has not changed
        if (
          requestId === activeRequestIdRef.current &&
          requestUserId === (user?.id || null) &&
          isAuthenticated
        ) {
          setOrders(response.data?.data || []);
        }
      } catch (err) {
        // If aborted or canceled, silently exit
        if (
          err.name === 'CanceledError' ||
          err.name === 'AbortError' ||
          err.code === 'ERR_CANCELED'
        ) {
          return;
        }

        // Only handle errors for the still-active request for the current user
        if (
          requestId === activeRequestIdRef.current &&
          requestUserId === (user?.id || null) &&
          isAuthenticated
        ) {
          console.error('Failed to load orders:', err);
          // If fetching fails, do not show previous account's orders
          setOrders([]);
          setError(
            err.response?.data?.error ||
              'Unable to load orders. Please check your backend connection.'
          );
        }
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [isAuthenticated, currentUserId, statusFilter, user?.id]
  );

  // Synchronize on authentication state, user account changes, or status filter changes
  useEffect(() => {
    const userChanged = prevUserIdRef.current !== currentUserId;
    prevUserIdRef.current = currentUserId;

    if (!isAuthenticated || !currentUserId) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setOrders([]);
      setError(null);
      setInspectOrderId(null);
      setStatusFilter('');
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    if (userChanged) {
      // Clear previous account's orders and modals immediately on account change
      setOrders([]);
      setError(null);
      setInspectOrderId(null);
      setStatusFilter('');
    }

    fetchOrders(false);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAuthenticated, currentUserId, authLoading, fetchOrders]);

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
