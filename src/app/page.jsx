// src/app/page.jsx
import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Selamat Datang di WBK PayGateway</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Silakan pilih opsi di bawah untuk melanjutkan.
        </p>
        <div className="text-center">
          <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500">
            Masuk
          </Link>
          <span className="mx-2">|</span>
          <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-500">
            Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
