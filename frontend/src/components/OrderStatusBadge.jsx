import React from 'react';
import { Clock, ChefHat, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotColor: '#D97706',
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    bgClass: 'bg-blue-100 text-blue-800 border-blue-300',
    dotColor: '#2563EB',
  },
  ready: {
    label: 'Ready for Pickup',
    icon: CheckCircle2,
    bgClass: 'bg-purple-100 text-purple-800 border-purple-300',
    dotColor: '#9333EA',
  },
  completed: {
    label: 'Completed',
    icon: CheckCheck,
    bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: '#059669',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bgClass: 'bg-rose-100 text-rose-800 border-rose-300',
    dotColor: '#E11D48',
  },
};

const OrderStatusBadge = ({ status }) => {
  const current = statusConfig[status] || {
    label: status,
    icon: Clock,
    bgClass: 'bg-gray-100 text-gray-800 border-gray-300',
    dotColor: '#6B7280',
  };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-xs ${current.bgClass}`}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: current.dotColor,
          display: 'inline-block',
        }}
      />
      <Icon size={13} />
      <span>{current.label}</span>
    </span>
  );
};

export default OrderStatusBadge;
