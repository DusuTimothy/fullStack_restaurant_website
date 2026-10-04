import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

const InspectorCustomerCard = ({ user }) => {
  return (
    <div className="inspector-customer-card">
      <h4 className="inspector-section-heading">Customer Information</h4>
      <div className="inspector-customer-grid">
        <div className="customer-info-item">
          <User size={16} className="text-gray-500" />
          <div>
            <span className="info-label">Name</span>
            <strong className="info-val">{user?.name || 'Walk-in Guest'}</strong>
          </div>
        </div>
        <div className="customer-info-item">
          <Mail size={16} className="text-gray-500" />
          <div>
            <span className="info-label">Email</span>
            <strong className="info-val">{user?.email || 'N/A'}</strong>
          </div>
        </div>
        <div className="customer-info-item">
          <Phone size={16} className="text-gray-500" />
          <div>
            <span className="info-label">Phone</span>
            <strong className="info-val">{user?.phone || 'N/A'}</strong>
          </div>
        </div>
        <div className="customer-info-item">
          <span className="info-label">Account Role</span>
          <span className="capitalize font-semibold text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-800">
            {user?.role || 'Guest'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InspectorCustomerCard;
