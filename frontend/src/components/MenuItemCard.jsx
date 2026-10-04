import React from 'react';
import { Plus, Check, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import useMenuItemCard from '../hooks/useMenuItemCard';

const MenuItemCard = ({ item, onDelete }) => {
  const {
    isAdmin,
    currentQuantityInCart,
    resolvedImage,
    justAdded,
    deleting,
    setImageError,
    handleAddToCart,
    handleDelete,
  } = useMenuItemCard({ item, onDelete });

  return (
    <div className={`menu-card ${!item.isAvailable ? 'sold-out' : ''}`}>
      {/* Thumbnail Container */}
      <div className="menu-card-image-wrap">
        <img
          src={resolvedImage}
          alt={item.name}
          className="menu-card-image"
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* Category Badge */}
        {item.category?.name && (
          <span className="card-category-tag">
            {item.category.name}
          </span>
        )}

        {/* Admin Delete Action Button */}
        {isAdmin && (
          <button
            type="button"
            className="card-admin-delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete this dish (Admin Only)"
            aria-label="Delete this dish"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}

        {/* Availability Badge */}
        {!item.isAvailable && (
          <div className="card-sold-out-overlay">
            <AlertCircle size={16} />
            <span>Currently Unavailable</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="menu-card-body">
        <div className="menu-card-header">
          <h3 className="menu-card-title">{item.name}</h3>
          <span className="menu-card-price">
            ${parseFloat(item.price).toFixed(2)}
          </span>
        </div>

        <p className="menu-card-desc">
          {item.description || 'Delicately prepared with fresh gourmet ingredients.'}
        </p>

        {/* Footer Actions */}
        <div className="menu-card-footer">
          {currentQuantityInCart > 0 && (
            <span className="in-cart-indicator">
              In cart: <strong>{currentQuantityInCart}</strong>
            </span>
          )}

          <button
            type="button"
            className={`add-to-cart-btn ${justAdded ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
          >
            {justAdded ? (
              <>
                <Check size={16} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>{currentQuantityInCart > 0 ? 'Add Another' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
