import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, User, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartItemRow from './CartItemRow';
import CartOrderSuccess from './CartOrderSuccess';
import CartEmptyState from './CartEmptyState';
import CartAuthPrompt from './CartAuthPrompt';
import CartFooter from './CartFooter';
import useCartCheckout from '../hooks/useCartCheckout';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemCount,
    totalAmount,
    orderNotes,
    setOrderNotes,
  } = useCart();

  const {
    submitting,
    errorMessage,
    orderSuccess,
    handleSubmitOrder,
    handleGoToOrders,
    handleDismissSuccess,
  } = useCartCheckout({
    cart,
    orderNotes,
    clearCart,
    closeCart,
    isAuthenticated,
  });

  if (!isCartOpen) return null;

  const handleLoginRedirect = () => {
    closeCart();
    navigate('/login');
  };

  const handleSignupRedirect = () => {
    closeCart();
    navigate('/signup');
  };

  return (
    <div className="drawer-overlay" onClick={closeCart}>
      <div
        className="drawer-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <ShoppingBag size={22} className="text-amber-600" />
            <h2 id="cart-drawer-title" className="drawer-title">
              Current Order
            </h2>
            <span className="drawer-count-badge">
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="drawer-content">
          {orderSuccess ? (
            <CartOrderSuccess
              order={orderSuccess}
              fallbackUserName={user?.name}
              onGoToOrders={handleGoToOrders}
              onBackToMenu={handleDismissSuccess}
            />
          ) : cart.length === 0 ? (
            <CartEmptyState onClose={closeCart} />
          ) : (
            <>
              {/* Authenticated User Status or Sign In Prompt */}
              {isAuthenticated ? (
                <div className="drawer-user-section-auth">
                  <div className="drawer-auth-user-info">
                    <User size={16} className="text-amber-600" />
                    <div>
                      <span className="drawer-auth-label">Ordering As: </span>
                      <strong className="drawer-auth-name">{user.name}</strong>
                      <span className="drawer-auth-email"> ({user.email})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <CartAuthPrompt
                  onLoginClick={handleLoginRedirect}
                  onSignupClick={handleSignupRedirect}
                />
              )}

              {/* Items List */}
              <div className="drawer-items-list">
                {cart.map((item) => (
                  <CartItemRow
                    key={item.menuItem.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeFromCart}
                  />
                ))}
              </div>

              {/* Order Notes / Special Instructions */}
              <div className="drawer-notes-section">
                <label className="drawer-section-label" htmlFor="order-notes">
                  Special Kitchen Instructions / Notes:
                </label>
                <textarea
                  id="order-notes"
                  className="drawer-notes-input"
                  rows={2}
                  placeholder="e.g., No onions, dressing on the side, extra spicy..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="drawer-error-alert">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Calculations and Submit Button */}
        {!orderSuccess && cart.length > 0 && (
          <CartFooter
            totalAmount={totalAmount}
            cartEmpty={cart.length === 0}
            submitting={submitting}
            isAuthenticated={isAuthenticated}
            onClearCart={clearCart}
            onSubmitOrder={handleSubmitOrder}
            onLoginClick={handleLoginRedirect}
          />
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
