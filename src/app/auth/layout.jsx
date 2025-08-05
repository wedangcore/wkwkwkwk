// src/app/auth/layout.jsx
import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            WBK PayGateway
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Silakan masuk atau daftar untuk melanjutkan
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
