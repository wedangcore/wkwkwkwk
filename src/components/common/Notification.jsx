// src/components/common/Notification.jsx
import React from 'react';

export default function Notification({ message }) {
  if (!message) return null;

  return (
    <div className={`p-3 rounded-md text-sm ${
      message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {message.text}
    </div>
  );
}
