import React from 'react';
import { Calendar, Eye } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';

const OrdersTable = ({ orders, isStaff, onStatusChange, onInspectOrder }) => {
  return (
    <div className="orders-table-wrapper">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date & Time</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>{isStaff ? 'Quick Advance' : 'Action'}</th>
            <th className="text-right">Details</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const itemCount = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
            return (
              <tr key={order.id} className="order-row">
                <td>
                  <span className="order-id-badge">#{order.id}</span>
                </td>

                <td>
                  <div className="order-date-cell">
                    <Calendar size={13} className="text-gray-400" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="order-time-sub">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>

                <td>
                  <div className="order-user-cell">
                    <span className="customer-name">{order.user?.name || 'Customer'}</span>
                    <span className="customer-email">{order.user?.email || 'N/A'}</span>
                  </div>
                </td>

                <td>
                  <span className="order-items-count">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </td>

                <td>
                  <strong className="order-amount-text">
                    ${parseFloat(order.totalAmount).toFixed(2)}
                  </strong>
                </td>

                <td>
                  <OrderStatusBadge status={order.status} />
                </td>

                <td>
                  {isStaff ? (
                    <select
                      className="inline-status-select"
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value)}
                      aria-label="Change status"
                    >
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : order.status === 'pending' ? (
                    <button
                      type="button"
                      className="btn-cancel-order-sm"
                      onClick={() => onStatusChange(order.id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 capitalize">{order.status}</span>
                  )}
                </td>

                <td className="text-right">
                  <button
                    type="button"
                    className="btn-inspect-order"
                    onClick={() => onInspectOrder(order.id)}
                    title="Inspect line items and customer details"
                  >
                    <Eye size={15} />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
