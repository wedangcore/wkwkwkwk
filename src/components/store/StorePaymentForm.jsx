// src/components/store/StorePaymentForm.jsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Notification from '@/components/common/Notification'; // Asumsi path benar

export default function StorePaymentForm({ merchantUsername, paymentMethods }) {
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!amount || !selectedMethodId) {
      setMessage({ type: 'error', text: 'Jumlah dan metode pembayaran harus dipilih.' });
      return;
    }

    try {
      const res = await fetch(`/api/store/${merchantUsername}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(amount), paymentMethodId: selectedMethodId }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect ke paymentUrl yang diberikan oleh API
        router.push(data.paymentUrl);
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal membuat transaksi.' });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
    }
  };

  const groupedMethods = paymentMethods.reduce((acc, method) => {
    const category = method.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(method);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Notification message={message} />

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Jumlah Pembayaran (Rp)</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          min="1"
        />
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Pilih Metode Pembayaran</label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={selectedMethodId}
          onChange={(e) => setSelectedMethodId(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        >
          <option value="">-- Pilih Metode --</option>
          {Object.keys(groupedMethods).map(category => (
            <optgroup key={category} label={category}>
              {groupedMethods[category].map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Bayar Sekarang
      </button>
    </form>
  );
}
