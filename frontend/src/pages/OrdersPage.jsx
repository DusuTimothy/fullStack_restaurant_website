import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrderInspectorModal from '../components/OrderInspectorModal';
import OrdersMetrics from '../components/OrdersMetrics';
import OrdersTabs from '../components/OrdersTabs';
import OrdersTable from '../components/OrdersTable';
import AuthRequiredCard from '../components/AuthRequiredCard';
import useOrders from '../hooks/useOrders';

const OrdersPage = () => {
  const { user, isAuthenticated, isStaff, loading: authLoading } = useAuth();
  const {
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
  } = useOrders({ isAuthenticated, authLoading, user });

  // If session is still loading
  if (authLoading) {
    return (
      <div className="page-container">
        <div className="page-loading-state">
          <Loader2 size={44} className="animate-spin text-amber-600" />
          <p>Verifying session...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, prompt them to sign in
  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <AuthRequiredCard
          title="Login Required"
          message="Please login or create an account to view and track your orders."
          redirectPath="/orders"
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header & Stats Banner */}
      <div className="orders-header-row">
        <div>
          <span className="hero-eyebrow">
            {isStaff ? 'Kitchen & Management' : 'Customer Account'}
          </span>
          <h1 className="hero-title">
            {isStaff ? 'Orders Dashboard' : 'My Orders'}
          </h1>
          <p className="hero-subtitle">
            {isStaff
              ? 'Monitor incoming orders, inspect line items, and advance order states.'
              : `Viewing orders placed by ${user.name} (${user.email}).`}
          </p>
        </div>

        <button
          type="button"
          className="btn-refresh"
          onClick={() => fetchOrders(true)}
          disabled={loading || refreshing}
          title="Refresh orders list"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <OrdersMetrics
        isStaff={isStaff}
        totalOrders={orders.length}
        pendingAndPrepCount={pendingCount + preparingCount}
        totalRevenue={totalRevenue}
      />

      {/* Filter Tabs */}
      <OrdersTabs
        currentFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* Main Table / Cards Content */}
      {loading ? (
        <div className="page-loading-state">
          <Loader2 size={44} className="animate-spin text-amber-600" />
          <p>Fetching active orders...</p>
        </div>
      ) : error ? (
        <div className="page-error-state">
          <AlertCircle size={40} className="text-rose-600" />
          <h3>Error Loading Orders</h3>
          <p>{error}</p>
          <button type="button" className="btn-primary mt-3" onClick={() => fetchOrders()}>
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="page-empty-state">
          <ClipboardList size={48} className="text-gray-400" />
          <h3>No Orders Found</h3>
          <p>
            {statusFilter
              ? `No orders currently match the '${statusFilter}' status.`
              : isStaff
              ? 'No orders have been placed yet.'
              : 'You have not placed any orders yet. Explore our delicious menu to order your first meal!'}
          </p>
          {!isStaff && (
            <Link to="/" className="btn-primary mt-3">
              Browse Menu
            </Link>
          )}
        </div>
      ) : (
        <OrdersTable
          orders={orders}
          isStaff={isStaff}
          onStatusChange={handleQuickStatusChange}
          onInspectOrder={setInspectOrderId}
        />
      )}

      {/* Inspector Modal */}
      {inspectOrderId && (
        <OrderInspectorModal
          orderId={inspectOrderId}
          onClose={() => setInspectOrderId(null)}
          onStatusUpdated={handleOrderUpdatedInModal}
        />
      )}
    </div>
  );
};

export default OrdersPage;
