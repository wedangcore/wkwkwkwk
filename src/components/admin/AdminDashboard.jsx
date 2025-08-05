// src/components/admin/AdminDashboard.jsx
'use client';

import React from 'react';

export default function AdminDashboard({ webData, totalUsers, totalTransactions }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nama Website</h3>
        <p className="text-3xl font-bold text-indigo-600">{webData?.name || 'N/A'}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Pengguna</h3>
        <p className="text-3xl font-bold text-green-600">{totalUsers}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Transaksi</h3>
        <p className="text-3xl font-bold text-blue-600">{totalTransactions}</p>
      </div>
      {/* Tambahkan statistik lain sesuai kebutuhan */}
    </div>
  );
}
