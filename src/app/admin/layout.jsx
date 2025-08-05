// src/app/admin/layout.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/member' },
  { name: 'Member', href: '/admin/member' },
  { name: 'Transaksi', href: '/admin/transaction' },
  { name: 'Pengaturan', href: '/admin/setting' },
];

export default function AdminLayout({ children }) {
  const [user, setUser ] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAdminSession = async () => {
      try {
        const res = await fetch('/api/user/me'); // Asumsi API ini mengembalikan data user
        if (res.ok) {
          const data = await res.json();
          if (!data.user.isAdmin) {
            router.push('/auth/login?error_message=Akses ditolak. Akun bukan administrator.');
          } else {
            setUser (data.user);
          }
        } else {
          router.push('/auth/login?error_message=Sesi Anda telah berakhir. Silakan login kembali.');
        }
      } catch (error) {
        console.error('Error verifying admin session:', error);
        router.push('/auth/login?error_message=Terjadi kesalahan saat memverifikasi sesi.');
      } finally {
        setLoading(false);
      }
    };

    verifyAdminSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg overflow-y-auto">
        <div className="flex items-center justify-center h-16 bg-indigo-600 text-white text-2xl font-semibold">
          WBK Admin
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {adminNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4 text-gray-700">Halo, {user.name}</span>
            <button
              onClick={() => router.push('/auth/logout')}
              className="text-red-600 hover:text-red-900"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
