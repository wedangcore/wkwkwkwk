// src/components/common/Sidebar.jsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg overflow-y-auto">
      <div className="flex items-center justify-center h-16 bg-indigo-600 text-white text-2xl font-semibold">
        WBK Admin
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/admin/member" className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200">
          Member
        </Link>
        <Link href="/admin/transaction" className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200">
          Transaksi
        </Link>
        <Link href="/admin/setting" className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200">
          Pengaturan
        </Link>
      </nav>
    </aside>
  );
}
