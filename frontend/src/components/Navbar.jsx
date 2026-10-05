import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  ClipboardList,
  ShieldCheck,
  ShoppingBasketIcon,
  Menu,
  X,
  Users,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NavUserSection from './NavUserSection';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItemCount, openCart } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever navigation path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Branding */}
        <NavLink to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-logo-icon">
            <UtensilsCrossed size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-title">AURA BISTRO</span>
            <span className="brand-subtitle">Management & Kitchen</span>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav desktop-only-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            <UtensilsCrossed size={18} />
            <span>Menu</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={18} />
            <span>{isAdmin ? 'Orders Dashboard' : 'My Orders'}</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Users</span>
            </NavLink>
          )}
        </nav>

        {/* Right Controls: Desktop Auth Controls & Cart Button & Mobile Hamburger */}
        <div className="navbar-actions">
          {/* Admin Indicator Badge (Desktop) */}
          {isAdmin && (
            <span
              className="admin-status-pill desktop-only-pill"
              title="You have Admin privileges to manage menu, orders, and users"
            >
              <ShieldCheck size={14} />
              <span>Admin Mode</span>
            </span>
          )}

          {/* Desktop User profile / auth actions */}
          <div className="desktop-only-auth">
            <NavUserSection
              isAuthenticated={isAuthenticated}
              user={user}
              onLogout={handleLogout}
            />
          </div>

          {/* Cart Trigger with live count */}
          <button
            type="button"
            className="cart-trigger-btn"
            onClick={openCart}
            aria-label="Open Cart Drawer"
          >
            <ShoppingBasketIcon size={20} />
            <span className="cart-label">Cart</span>
            {totalItemCount > 0 && (
              <span className="cart-badge-count animate-pop">
                {totalItemCount}
              </span>
            )}
          </button>

          {/* Responsive Hamburger Toggle Button (Mobile/Tablet) */}
          <button
            type="button"
            className="navbar-hamburger-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Overlay Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-menu-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile Navigation Menu"
          >
            {/* User status card in mobile drawer if logged in */}
            {isAuthenticated ? (
              <div className="mobile-user-card">
                <div className="mobile-user-avatar">
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                </div>
                <div className="mobile-user-details">
                  <div className="flex items-center gap-2">
                    <span className="mobile-user-name">{user?.name}</span>
                    <span className={`role-badge role-badge-${user?.role}`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <span className="mobile-user-email">{user?.email}</span>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-prompt-card">
                <p className="text-sm font-semibold text-slate-700">Welcome to Aura Bistro</p>
                <p className="text-xs text-slate-500">Sign in to track orders or join our culinary team</p>
                <div className="mobile-auth-btn-row">
                  <Link
                    to="/login"
                    className="btn-primary mobile-auth-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={15} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-secondary mobile-auth-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserPlus size={15} />
                    <span>Sign Up</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation links in mobile drawer */}
            <div className="mobile-nav-links">
              <NavLink
                to="/"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                end
                onClick={() => setMobileMenuOpen(false)}
              >
                <UtensilsCrossed size={18} />
                <span>Restaurant Menu</span>
              </NavLink>

              <NavLink
                to="/orders"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <ClipboardList size={18} />
                <span>{isAdmin ? 'Orders Dashboard' : 'My Orders'}</span>
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/users"
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users size={18} />
                  <span>Users Management</span>
                </NavLink>
              )}

              {isAuthenticated && (
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon size={18} />
                  <span>My Profile & Account</span>
                </NavLink>
              )}
            </div>

            {/* Mobile Footer / Logout */}
            {isAuthenticated && (
              <div className="mobile-menu-footer">
                <button
                  type="button"
                  className="btn-mobile-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
