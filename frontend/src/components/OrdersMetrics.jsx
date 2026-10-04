import React from 'react';
import { ClipboardList, Clock, TrendingUp } from 'lucide-react';

const OrdersMetrics = ({ isStaff, totalOrders, pendingAndPrepCount, totalRevenue }) => {
  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon-wrap bg-amber-50 text-amber-600">
          <ClipboardList size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">{isStaff ? 'Total Filtered' : 'My Orders'}</span>
          <span className="metric-value">{totalOrders}</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-wrap bg-orange-50 text-orange-600">
          <Clock size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Pending / Prep</span>
          <span className="metric-value">{pendingAndPrepCount}</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-wrap bg-emerald-50 text-emerald-600">
          <TrendingUp size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">{isStaff ? 'Total Volume' : 'Total Spent'}</span>
          <span className="metric-value">${totalRevenue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrdersMetrics;
