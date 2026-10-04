import React from 'react';
import { CheckCircle } from 'lucide-react';

const CartOrderSuccess = ({ order, fallbackUserName, onGoToOrders, onBackToMenu }) => {
  return (
    <div className="order-success-screen">
      <div className="success-icon-wrap">
        <CheckCircle size={56} className="text-emerald-600" />
      </div>
      <h3 className="success-title">Order Placed Successfully!</h3>
      <p className="success-desc">
        Order <strong>#{order.id}</strong> has been received by the kitchen.
      </p>
      <div className="success-card">
        <div className="success-row">
          <span>Customer:</span>
          <strong>{order.user?.name || fallbackUserName}</strong>
        </div>
        <div className="success-row">
          <span>Total Amount:</span>
          <strong>${parseFloat(order.totalAmount).toFixed(2)}</strong>
        </div>
        <div className="success-row">
          <span>Initial Status:</span>
          <span className="capitalize font-semibold text-amber-600">
            {order.status}
          </span>
        </div>
      </div>
      <div className="success-actions">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={onGoToOrders}
        >
          View in Orders Dashboard
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={onBackToMenu}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default CartOrderSuccess;
