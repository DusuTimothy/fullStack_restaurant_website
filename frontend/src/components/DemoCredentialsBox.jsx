import React from 'react';
import { ShieldCheck } from 'lucide-react';

const DemoCredentialsBox = ({ onSelectAccount }) => {
  return (
    <div className="auth-demo-box">
      <div className="auth-demo-header">
        <ShieldCheck size={16} className="text-amber-600" />
        <span>Sample Development Account:</span>
      </div>
      <div className="auth-demo-buttons">
        <button
          type="button"
          className="btn-demo-quick"
          onClick={() => onSelectAccount('alice@example.com', '')}
        >
          <strong>Customer:</strong> alice@example.com
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '0.5rem', lineHeight: '1.25' }}>
        Log in with the password configured in <code>SEED_USER_PASSWORD</code>. Administrator accounts must be provisioned via the operator CLI (<code>npm run admin:create</code>).
      </p>
    </div>
  );
};

export default DemoCredentialsBox;
