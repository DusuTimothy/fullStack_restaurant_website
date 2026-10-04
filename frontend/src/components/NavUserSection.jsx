import React from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, LogOut, LogIn, UserPlus } from 'lucide-react';

const NavUserSection = ({ isAuthenticated, user, onLogout }) => {
  if (isAuthenticated) {
    return (
      <div className="navbar-user-group">
        <div className="navbar-user-chip" title={`Signed in as ${user.email}`}>
          <UserIcon size={15} className="text-amber-700" />
          <span className="navbar-user-name">{user.name}</span>
          <span className="navbar-role-tag">{user.role}</span>
        </div>
        <button
          type="button"
          className="btn-logout"
          onClick={onLogout}
          title="Sign out of your account"
          aria-label="Sign out"
        >
          <LogOut size={16} />
          <span className="hidden-mobile">Log-out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="navbar-auth-links">
      <Link to="/login" className="btn-nav-login">
        <LogIn size={15} />
        <span>Login</span>
      </Link>
      <Link to="/signup" className="btn-nav-signup">
        <UserPlus size={15} />
        <span>Sign Up</span>
      </Link>
    </div>
  );
};

export default NavUserSection;
