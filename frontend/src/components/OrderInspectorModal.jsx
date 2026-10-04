import React from 'react';
import { X, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from './OrderStatusBadge';
import InspectorCustomerCard from './InspectorCustomerCard';
import InspectorStatusControl from './InspectorStatusControl';
import InspectorLineItems from './InspectorLineItems';
import InspectorNotesBox from './InspectorNotesBox';
import useOrderInspector from '../hooks/useOrderInspector';

const OrderInspectorModal = ({ orderId, onClose, onStatusUpdated }) => {
  const { isStaff } = useAuth();
  const { order, loading, updating, error, handleStatusChange } = useOrderInspector({
    orderId,
    onStatusUpdated,
  });

  if (!orderId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title-row">
              <h2 className="modal-title">Order #{orderId} Details</h2>
              {order && <OrderStatusBadge status={order.status} />}
            </div>
            {order && (
              <span className="modal-timestamp">
                <Calendar size={14} />
                {new Date(order.createdAt).toLocaleString()}
              </span>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading-state">
              <Loader2 size={36} className="animate-spin text-amber-600" />
              <p>Loading order breakdown...</p>
            </div>
          ) : error ? (
            <div className="modal-error-state">
              <AlertCircle size={32} className="text-rose-600" />
              <p>{error}</p>
            </div>
          ) : order ? (
            <>
              {/* Customer Details Box */}
              <InspectorCustomerCard user={order.user} />

              {/* Status Update Control */}
              <InspectorStatusControl
                isStaff={isStaff}
                orderStatus={order.status}
                updating={updating}
                onStatusChange={handleStatusChange}
              />

              {/* Line Items List */}
              <InspectorLineItems items={order.items} />

              {/* Special Instructions / Notes */}
              <InspectorNotesBox notes={order.notes} />

              {/* Order Total Breakdown */}
              <div className="inspector-total-banner">
                <div className="total-banner-label">Total Amount Paid / Due:</div>
                <div className="total-banner-price">
                  ${parseFloat(order.totalAmount).toFixed(2)}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderInspectorModal;
