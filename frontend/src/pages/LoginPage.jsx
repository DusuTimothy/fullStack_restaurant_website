import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import AuthBrandHeader from '../components/AuthBrandHeader';
import DemoCredentialsBox from '../components/DemoCredentialsBox';
import useLoginForm from '../hooks/useLoginForm';

const LoginPage = () => {
  const location = useLocation();
  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    errorMessage,
    handleSubmit,
    fillDemoAccount,
  } = useLoginForm(redirectUrl);

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Brand Header */}
        <AuthBrandHeader
          title="Welcome Back"
          subtitle="Login to your Aura Bistro account"
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link
              to={redirectUrl !== '/' ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : '/signup'}
              className="auth-link"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Demo Credentials Box */}
        <DemoCredentialsBox onSelectAccount={fillDemoAccount} />
      </div>
    </div>
  );
};

export default LoginPage;
