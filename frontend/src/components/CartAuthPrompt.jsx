import React from 'react';
import { LogIn } from 'lucide-react';

const CartAuthPrompt = ({ onLoginClick, onSignupClick }) => {
  return (
    <div className="drawer-auth-prompt-card">
      <div className="drawer-auth-prompt-icon">
        <LogIn size={20} className="text-amber-600" />
      </div>
      <div className="drawer-auth-prompt-content">
        <strong className="drawer-auth-prompt-title">Login to complete order</strong>
        <p className="drawer-auth-prompt-desc">
          Login to your account or sign up to finalize this order.
        </p>
        <div className="drawer-auth-prompt-actions">
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={onLoginClick}
          >
            Login
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onSignupClick}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartAuthPrompt;
