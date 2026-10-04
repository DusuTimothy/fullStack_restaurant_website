import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { resolveImageUrl } from '../api/axiosClient';

const CartItemRow = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const resolvedImg = item.menuItem.imageUrl
    ? resolveImageUrl(item.menuItem.imageUrl)
    : null;

  return (
    <div className="drawer-item-row">
      {/* Thumbnail */}
      <div className="drawer-item-thumb">
        {resolvedImg ? (
          <img
            src={resolvedImg}
            alt={item.menuItem.name}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="drawer-item-thumb-placeholder">🍽️</div>
        )}
      </div>

      {/* Info */}
      <div className="drawer-item-info">
        <h4 className="drawer-item-title">{item.menuItem.name}</h4>
        <div className="drawer-item-price-calc">
          ${parseFloat(item.menuItem.price).toFixed(2)} &times; {item.quantity} ={' '}
          <strong>${item.subtotal.toFixed(2)}</strong>
        </div>
      </div>

      {/* Quantity Stepper & Remove */}
      <div className="drawer-item-actions">
        <div className="stepper-controls">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus size={13} />
          </button>
          <span className="stepper-value">{item.quantity}</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus size={13} />
          </button>
        </div>
        <button
          type="button"
          className="drawer-remove-item-btn"
          onClick={() => onRemoveItem(item.menuItem.id)}
          title="Remove item"
          aria-label="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CartItemRow;
