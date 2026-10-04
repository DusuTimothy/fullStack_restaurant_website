import React from 'react';
import { Send, Loader2, LogIn } from 'lucide-react';

const CartFooter = ({
  totalAmount,
  cartEmpty,
  submitting,
  isAuthenticated,
  onClearCart,
  onSubmitOrder,
  onLoginClick,
}) => {
  return (
    <div className="drawer-footer">
      <div className="drawer-subtotal-row">
        <span className="subtotal-label">Subtotal</span>
        <span className="subtotal-value">${totalAmount.toFixed(2)}</span>
      </div>
      <div className="drawer-subtotal-row total">
        <span className="total-label">Estimated Total</span>
        <span className="total-value">${totalAmount.toFixed(2)}</span>
      </div>

      <div className="drawer-buttons-row">
        <button
          type="button"
          className="btn-clear-cart"
          onClick={onClearCart}
          disabled={submitting}
        >
          Clear
        </button>

        {isAuthenticated ? (
          <button
            type="button"
            className="btn-submit-order"
            onClick={onSubmitOrder}
            disabled={submitting || cartEmpty}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Place Order (${totalAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn-submit-order"
            onClick={onLoginClick}
          >
            <LogIn size={18} />
            <span>Login to Place Order</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CartFooter;
