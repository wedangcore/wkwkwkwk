// src/app/member/tutorial/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TutorialPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedCats, setSelectedCats] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data pengguna.' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedCats((prev) => [...prev, value]);
    } else {
      setSelectedCats((prev) => prev.filter((cat) => cat !== value));
    }
  };

  const handleDownloadMacro = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (selectedCats.length === 0) {
      setMessage({ type: 'error', text: 'Anda harus memilih setidaknya satu kategori pembayaran.' });
      return;
    }

    try {
      const res = await fetch('/api/member/tutorial/macrodroid/download', { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cats: selectedCats }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'WBK-PayGateway.macro';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'File MacroDroid berhasil diunduh.' });
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.message || 'Gagal mengunduh file MacroDroid.' });
      }
    } catch (error) {
      console.error('Error downloading MacroDroid file:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat tutorial...</div>;
  }

  const configuredMethods = {
    hasQris: user?.paymentMethods.some(m => m.category === 'QRIS' && m.isEnabled),
    hasEwallet: user?.paymentMethods.some(m => m.category === 'Ewallet' && m.isEnabled),
    hasBank: user?.paymentMethods.some(m => m.category === 'Bank' && m.isEnabled),
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Tutorial</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Integrasi MacroDroid</h3>
        <p className="text-gray-600 mb-4">
          Unduh file konfigurasi MacroDroid untuk otomatisasi notifikasi pembayaran.
        </p>
        <form onSubmit={handleDownloadMacro} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                value="qris"
                checked={selectedCats.includes('qris')}
                onChange={handleCheckboxChange}
                disabled={!configuredMethods.hasQris}
              />
              <span className="ml-2 text-gray-700">QRIS {configuredMethods.hasQris ? '' : '(Belum dikonfigurasi)'}</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                value="ewallet"
                checked={selectedCats.includes('ewallet')}
                onChange={handleCheckboxChange}
                disabled={!configuredMethods.hasEwallet}
              />
              <span className="ml-2 text-gray-700">E-wallet {configuredMethods.hasEwallet ? '' : '(Belum dikonfigurasi)'}</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                value="bank"
                checked={selectedCats.includes('bank')}
                onChange={handleCheckboxChange}
                disabled={!configuredMethods.hasBank}
              />
              <span className="ml-2 text-gray-700">Bank {configuredMethods.hasBank ? '' : '(Belum dikonfigurasi)'}</span>
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Unduh File MacroDroid
          </button>
        </form>
      </div>

      {/* Tambahkan bagian tutorial lainnya di sini */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">Panduan Umum</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Pastikan Anda telah mengkonfigurasi metode pembayaran di halaman <Link href="/member/payment" className="text-indigo-600 hover:underline">Pembayaran</Link>.</li>
          <li>Pelajari cara menggunakan API Key Anda di halaman <Link href="/member/documentation" className="text-indigo-600 hover:underline">Dokumentasi</Link>.</li>
          <li>Untuk notifikasi Telegram, pastikan Anda telah mengatur bot di halaman <Link href="/member/integration" className="text-indigo-600 hover:underline">Integrasi</Link>.</li>
        </ul>
      </div>
    </div>
  );
}
