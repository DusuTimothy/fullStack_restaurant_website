import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

const AuthBrandHeader = ({ title, subtitle }) => {
  return (
    <div className="auth-header">
      <div className="auth-logo-badge">
        <UtensilsCrossed size={28} />
      </div>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </div>
  );
};

export default AuthBrandHeader;
