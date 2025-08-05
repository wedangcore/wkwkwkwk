// src/app/payment/error/page.jsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function PaymentErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Terjadi Kesalahan</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Maaf, terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi.
        </p>
        <div className="text-center">
          <Link href="/member/payment" className="text-indigo-600 hover:text-indigo-500">
            Kembali ke Halaman Pembayaran
          </Link>
        </div>
      </div>
    </div>
  );
}
