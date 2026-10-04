import React from 'react';
import { resolveImageUrl } from '../api/axiosClient';

const InspectorLineItems = ({ items = [] }) => {
  return (
    <div className="inspector-line-items-section">
      <h4 className="inspector-section-heading">
        Ordered Items ({items.length})
      </h4>

      <div className="inspector-items-table-wrap">
        <table className="inspector-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const img = item.menuItem?.imageUrl ? resolveImageUrl(item.menuItem.imageUrl) : null;
              return (
                <tr key={item.id}>
                  <td>
                    <div className="table-item-cell">
                      <div className="table-item-thumb">
                        {img ? (
                          <img src={img} alt={item.menuItem?.name} />
                        ) : (
                          <span>🍽️</span>
                        )}
                      </div>
                      <div>
                        <span className="table-item-name">
                          {item.menuItem?.name || `Item #${item.menuItemId}`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="text-center font-bold">{item.quantity}</td>
                  <td className="text-right">
                    ${parseFloat(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="text-right font-bold text-gray-900">
                    ${parseFloat(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectorLineItems;
