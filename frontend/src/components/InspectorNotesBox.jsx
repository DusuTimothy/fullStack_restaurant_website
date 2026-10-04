import React from 'react';
import { FileText } from 'lucide-react';

const InspectorNotesBox = ({ notes }) => {
  if (!notes) return null;

  return (
    <div className="inspector-notes-box">
      <div className="notes-box-header">
        <FileText size={16} className="text-amber-600" />
        <strong>Kitchen & Delivery Notes:</strong>
      </div>
      <p className="notes-box-body">{notes}</p>
    </div>
  );
};

export default InspectorNotesBox;
