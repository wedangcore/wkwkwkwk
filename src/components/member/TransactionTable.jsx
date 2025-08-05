// src/components/member/TransactionTable.jsx
'use client';

import React from 'react';

export default function TransactionTable({ transactions, onUpdateStatus }) {
  if (!transactions || transactions.length === 0) {
    return <p className="text-gray-600">Belum ada riwayat transaksi.</p>;
  }

  return (
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
          {transactions.map((tx) => (
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
                      onClick={() => onUpdateStatus(tx.transactionId, 'sukses')}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Set Sukses
                    </button>
                    <button
                      onClick={() => onUpdateStatus(tx.transactionId, 'gagal')}
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
  );
}
