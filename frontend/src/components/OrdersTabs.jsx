import React from 'react';

const STATUS_FILTERS = [
  { key: '', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const OrdersTabs = ({ currentFilter, onSelectFilter }) => {
  return (
    <div className="orders-tabs-bar">
      {STATUS_FILTERS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`orders-tab-btn ${currentFilter === tab.key ? 'active' : ''}`}
          onClick={() => onSelectFilter(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default OrdersTabs;
