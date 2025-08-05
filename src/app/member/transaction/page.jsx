// src/app/member/transaction/page.jsx
'use client';

import React, { useState, useEffect } from 'react';

export default function TransactionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/me'); // Asumsi API ini mengembalikan data user lengkap
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data transaksi.' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTransactionStatus = async (transactionId, newStatus) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status transaksi ini menjadi ${newStatus}?`)) {
      return;
    }
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/member/transaction/update/${transactionId}`, { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData(); // Refresh data
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat riwayat transaksi...</div>;
  }

  const sortedTransactions = user?.riwayatTransaksi
    ? [...user.riwayatTransaksi].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Riwayat Transaksi</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {sortedTransactions.length === 0 ? (
        <p className="text-gray-600">Belum ada riwayat transaksi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Transaksi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metode
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.map((tx) => (
                <tr key={tx.transactionId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tx.transactionId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rp {tx.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tx.status === 'sukses' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {tx.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateTransactionStatus(tx.transactionId, 'sukses')}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Set Sukses
                        </button>
                        <button
                          onClick={() => handleUpdateTransactionStatus(tx.transactionId, 'gagal')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Set Gagal
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
