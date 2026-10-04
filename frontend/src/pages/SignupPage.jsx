import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Phone, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import AuthBrandHeader from '../components/AuthBrandHeader';
import useSignupForm from '../hooks/useSignupForm';

const SignupPage = () => {
  const location = useLocation();
  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const {
    formData,
    showPassword,
    setShowPassword,
    loading,
    errorMessage,
    errorDetails,
    handleChange,
    handleSubmit,
  } = useSignupForm(redirectUrl);

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Brand Header */}
        <AuthBrandHeader
          title="Create an Account"
          subtitle="Join Aura Bistro to enjoy seamless dining and takeout"
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="shrink-0" />
            <div>
              <strong>{errorMessage}</strong>
              {errorDetails.length > 0 && (
                <ul className="auth-error-list">
                  {errorDetails.map((d, i) => (
                    <li key={i}>{d.message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">
              Full Name *
            </label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input
                id="signup-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="auth-input"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              Email Address *
            </label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="auth-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Password * (min. 6 characters)
            </label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                className="auth-input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
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

          <div className="form-group">
            <label className="form-label" htmlFor="signup-phone">
              Phone Number (Optional)
            </label>
            <div className="auth-input-wrapper">
              <Phone size={18} className="auth-input-icon" />
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="auth-input"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-role-notice">
            <span>🛡️ Public signups receive a standard <strong>Customer</strong> account for ordering.</span>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link
              to={redirectUrl !== '/' ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
              className="auth-link"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
