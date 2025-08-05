// src/app/member/testing/page.jsx
'use client';

import React, { useState, useEffect } from 'react';

export default function TestingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [apiResponse, setApiResponse] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');

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

  const handleTestApi = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setApiResponse(null);

    if (!selectedMethod || !amount) {
      setMessage({ type: 'error', text: 'Pilih metode pembayaran dan masukkan jumlah.' });
      return;
    }

    const methodDetails = user.paymentMethods.find(m => m.id === selectedMethod);
    if (!methodDetails) {
      setMessage({ type: 'error', text: 'Metode pembayaran tidak ditemukan.' });
      return;
    }

    const endpoint = `/api/payment/${methodDetails.category.toLowerCase()}`;
    const payload = {
      action: 'create',
      apikey: user.apiKey,
      amount: parseInt(amount),
      paymentMethod: selectedMethod,
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setApiResponse(data);
      if (res.ok) {
        setMessage({ type: 'success', text: 'API berhasil diuji.' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menguji API.' });
      }
    } catch (error) {
      console.error('API testing error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
      setApiResponse({ success: false, message: error.message });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data pengujian...</div>;
  }

  const enabledPaymentMethods = user?.paymentMethods.filter(m => m.isEnabled) || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Pengujian API</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">API Key Anda:</h3>
        <p className="bg-gray-100 p-3 rounded-md font-mono text-sm break-all">
          {user?.apiKey || 'Tidak ada API Key'}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Gunakan API Key ini untuk otentikasi permintaan ke endpoint API Anda.
        </p>
      </div>

      <form onSubmit={handleTestApi} className="space-y-4">
        <h3 className="text-xl font-semibold mb-3">Uji Pembuatan Transaksi</h3>
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Pilih Metode Pembayaran</label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">-- Pilih Metode --</option>
            {enabledPaymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.name} ({method.category})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Jumlah Transaksi (Rp)</label>
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
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Uji API
        </button>
      </form>

      {apiResponse && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Respons API:</h3>
          <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
            <code>{JSON.stringify(apiResponse, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
