import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';

const AuthRequiredCard = ({
  title = 'Login Required',
  message = 'Please login or create an account to view and track your orders.',
  redirectPath = '/orders',
}) => {
  return (
    <div className="auth-required-card">
      <div className="auth-required-icon-wrap">
        <Lock size={44} className="text-amber-600" />
      </div>
      <h2 className="auth-required-title">{title}</h2>
      <p className="auth-required-desc">{message}</p>
      <div className="auth-required-actions">
        <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="btn-primary">
          <LogIn size={16} />
          <span>Login</span>
        </Link>
        <Link to={`/signup?redirect=${encodeURIComponent(redirectPath)}`} className="btn-secondary">
          <span>Create Account</span>
        </Link>
      </div>
    </div>
  );
};

export default AuthRequiredCard;
