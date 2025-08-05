// src/app/store/layout.jsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function StoreLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">WBK PayGateway</Link>
            <nav className="space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Beranda</Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">Masuk</Link>
              <Link href="/auth/signup" className="text-gray-600 hover:text-gray-900">Daftar</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {children}
      </main>

      <footer className="bg-white text-center py-4">
        <p className="text-gray-600">© 2023 WBK PayGateway. All rights reserved.</p>
      </footer>
    </div>
  );
}
