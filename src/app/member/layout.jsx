// src/app/member/layout.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image'; // Untuk logo/ikon

// Asumsi Anda memiliki helper untuk mendapatkan data user dari session/local storage
// atau memanggil API untuk memvalidasi sesi
// import { getAuthUser } from '@/lib/auth'; // Contoh helper

const memberNavItems = [
  { name: 'Pembayaran', href: '/member/payment', icon: '/icons/payment.svg' },
  { name: 'Transaksi', href: '/member/transaction', icon: '/icons/transaction.svg' },
  { name: 'Pengujian API', href: '/member/testing', icon: '/icons/testing.svg' },
  { name: 'Log Permintaan', href: '/member/log-request', icon: '/icons/log.svg' },
  { name: 'Integrasi', href: '/member/integration', icon: '/icons/integration.svg' },
  { name: 'Tutorial', href: '/member/tutorial', icon: '/icons/tutorial.svg' },
  { name: 'Dokumentasi', href: '/member/documentation', icon: '/icons/documentation.svg' },
  { name: 'Profil', href: '/member/profile', icon: '/icons/profile.svg' },
];

export default function MemberLayout({ children }) {
  const [user, setUser] = useState(null); // State untuk menyimpan data user
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Fungsi untuk memverifikasi sesi pengguna
    const verifySession = async () => {
      try {
        // Panggil API untuk mendapatkan data user atau memvalidasi sesi
        // Ini bisa berupa API Route kustom Anda, misalnya /api/user/me
        const res = await fetch('/api/user/me'); // Asumsi Anda membuat API ini
        if (res.ok) {
          const userData = await res.json();
          setUser(userData.user);
        } else {
          // Jika sesi tidak valid, redirect ke halaman login
          router.push('/auth/login?error_message=Sesi Anda telah berakhir. Silakan login kembali.');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        router.push('/auth/login?error_message=Terjadi kesalahan saat memverifikasi sesi.');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' }); // Asumsi Anda membuat API logout
      if (res.ok) {
        router.push('/auth/login?success_message=Anda berhasil logout.');
      } else {
        alert('Gagal logout. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Terjadi kesalahan saat logout.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Memuat...</p> {/* Atau spinner loading */}
      </div>
    );
  }

  if (!user) {
    // Jika user tidak ada setelah loading, berarti sudah di-redirect oleh useEffect
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-0 left-0 z-40 p-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 focus:outline-none focus:text-gray-900">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg overflow-y-auto transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:flex md:flex-col`}
      >
        <div className="flex items-center justify-center h-16 bg-indigo-600 text-white text-2xl font-semibold">
          WBK PayGateway
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {memberNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 ${
                pathname === item.href ? 'bg-gray-200 font-semibold' : ''
              }`}
              onClick={() => setSidebarOpen(false)} // Close sidebar on mobile after click
            >
              {item.icon && <Image src={item.icon} alt={item.name} width={20} height={20} className="mr-3" />}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-800">
              {memberNavItems.find(item => item.href === pathname)?.name || 'Dashboard Member'}
            </h1>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-gray-700">Halo, {user.name}</span>
            {/* Avatar atau dropdown user */}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
