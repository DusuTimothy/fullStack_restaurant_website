import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ClipboardList, ShieldCheck, ShoppingBasketIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NavUserSection from './NavUserSection';

const Navbar = () => {
  const navigate = useNavigate();
  const { totalItemCount, openCart } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Branding */}
        <NavLink to="/" className="navbar-brand">
          <div className="brand-logo-icon">
            <UtensilsCrossed size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-title">AURA BISTRO</span>
            <span className="brand-subtitle">Management & Kitchen</span>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav className="navbar-nav">
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
        </nav>

        {/* Right Controls: Auth Controls & Cart Button */}
        <div className="navbar-actions">
          {/* Admin Indicator Badge */}
          {isAdmin && (
            <span className="admin-status-pill" title="You have Admin privileges to create, edit, and delete dishes">
              <ShieldCheck size={14} />
              <span>Admin Mode</span>
            </span>
          )}

          {/* User profile / auth actions */}
          <NavUserSection
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
          />

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
        </div>
      </div>
    </header>
  );
};

export default Navbar;
