import React from 'react';
import { ShoppingBag } from 'lucide-react';

const CartEmptyState = ({ onClose }) => {
  return (
    <div className="drawer-empty-state">
      <ShoppingBag size={64} className="empty-cart-icon" />
      <h3 className="empty-cart-title">Your Cart is Empty</h3>
      <p className="empty-cart-desc">
        Browse our delicious menu and add some gourmet items to your order!
      </p>
      <button
        type="button"
        className="btn-primary mt-4"
        onClick={onClose}
      >
        Browse Menu
      </button>
    </div>
  );
};

export default CartEmptyState;
