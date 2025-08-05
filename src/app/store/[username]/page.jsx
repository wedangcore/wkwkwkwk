// src/app/store/[username]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StorePage({ params }) {
  const { username } = params;
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchStoreData();
  }, [username]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/${username}`); // Asumsi Anda membuat API ini
      if (res.ok) {
        const data = await res.json();
        setStoreData(data.store);
      } else {
        setMessage({ type: 'error', text: 'Toko tidak ditemukan.' });
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data toko...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{storeData?.name || 'Toko Tidak Ditemukan'}</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {storeData ? (
        <div>
          <p className="text-gray-700">Selamat datang di toko {storeData.name}!</p>
          <h3 className="text-xl font-semibold mt-4">Metode Pembayaran</h3>
          <ul className="list-disc list-inside">
            {storeData.paymentMethods.map((method) => (
              <li key={method.id}>
                {method.name} - {method.category}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-600">Toko tidak ditemukan.</p>
      )}
    </div>
  );
}
