// src/components/member/PaymentMethodList.jsx
'use client';

import React from 'react';
import Image from 'next/image';

export default function PaymentMethodList({
  methods,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  if (!methods || methods.length === 0) {
    return <p className="text-gray-600">Belum ada metode pembayaran yang ditambahkan.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kategori
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Akun/QRIS Info
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Min/Max
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fee
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {methods.map((method) => (
            <tr key={method._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {method.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {method.iconUrl && (
                  <Image src={method.iconUrl} alt={method.name} width={24} height={24} className="inline-block mr-2" />
                )}
                {method.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {method.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {method.category === 'QRIS' ? (
                  <>
                    <p>{method.qrisName}</p>
                    <p className="text-xs text-gray-400 truncate">{method.qrisUrl}</p>
                  </>
                ) : (
                  <>
                    <p>{method.accountNumber}</p>
                    <p>{method.accountName}</p>
                  </>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Rp {method.minAmount.toLocaleString('id-ID')} - Rp {method.maxAmount.toLocaleString('id-ID')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {method.feeType === 'Persen' ? `${method.fee}%` : `Rp ${method.fee.toLocaleString('id-ID')}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  method.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {method.isEnabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(method)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onToggleStatus(method._id, method.isEnabled)}
                  className={`text-sm ${method.isEnabled ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} mr-3`}
                >
                  {method.isEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => onDelete(method._id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
