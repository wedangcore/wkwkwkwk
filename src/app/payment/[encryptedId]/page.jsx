// src/app/payment/[encryptedId]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentPage({ params }) {
  const { encryptedId } = params;
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTransactionData();
  }, [encryptedId]);

  const fetchTransactionData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payment/bank/status/${encryptedId}`); // Asumsi Anda membuat API ini
      if (res.ok) {
        const data = await res.json();
        setTransactionData(data.data);
      } else {
        setMessage({ type: 'error', text: 'Transaksi tidak ditemukan.' });
      }
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data pembayaran...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Detail Pembayaran</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {transactionData ? (
        <div>
          <p className="text-gray-700">ID Transaksi: {transactionData.transactionId}</p>
          <p className="text-gray-700">Jumlah: Rp {transactionData.amount.toLocaleString('id-ID')}</p>
          <p className="text-gray-700">Status: {transactionData.status}</p>
          <p className="text-gray-700">Metode: {transactionData.method}</p>
          <p className="text-gray-700">Tanggal: {new Date(transactionData.createdAt).toLocaleString('id-ID')}</p>
        </div>
      ) : (
        <p className="text-gray-600">Transaksi tidak ditemukan.</p>
      )}
    </div>
  );
}
