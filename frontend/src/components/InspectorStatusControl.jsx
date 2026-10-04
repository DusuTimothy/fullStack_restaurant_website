import React from 'react';
import { Loader2 } from 'lucide-react';

const InspectorStatusControl = ({ isStaff, orderStatus, updating, onStatusChange }) => {
  if (isStaff) {
    return (
      <div className="inspector-status-control-card">
        <div className="status-control-left">
          <span className="status-control-label">Update Order Status:</span>
          <p className="status-control-hint">Advance this order through the kitchen workflow.</p>
        </div>
        <div className="status-control-actions">
          <select
            className="status-select-dropdown"
            value={orderStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={updating}
          >
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready for Pickup</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {updating && <Loader2 size={16} className="animate-spin text-amber-600" />}
        </div>
      </div>
    );
  }

  if (orderStatus === 'pending') {
    return (
      <div className="inspector-status-control-card">
        <div className="status-control-left">
          <span className="status-control-label">Order Action:</span>
          <p className="status-control-hint">Your order is pending and can still be cancelled.</p>
        </div>
        <div className="status-control-actions">
          <button
            type="button"
            className="btn-danger-outline btn-sm"
            onClick={() => onStatusChange('cancelled')}
            disabled={updating}
          >
            {updating ? <Loader2 size={14} className="animate-spin" /> : 'Cancel Order'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default InspectorStatusControl;
