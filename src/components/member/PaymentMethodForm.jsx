// src/components/member/PaymentMethodForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Notification from '@/components/common/Notification'; // Asumsi path benar

export default function PaymentMethodForm({
  method = null, // Jika ada, berarti mode edit
  onSave, // Callback setelah save
  onCancel, // Callback setelah cancel
}) {
  const [formType, setFormType] = useState('bank_ewallet'); // 'bank_ewallet' or 'qris'
  const [methodId, setMethodId] = useState('');
  const [methodName, setMethodName] = useState('');
  const [methodCategory, setMethodCategory] = useState('Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [qrisName, setQrisName] = useState('');
  const [qrisString, setQrisString] = useState('');
  const [qrisUrl, setQrisUrl] = useState('');
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(0);
  const [fee, setFee] = useState(0);
  const [feeType, setFeeType] = useState('Fixed');
  const [iconUrl, setIconUrl] = useState('');
  const [notificationTemplates, setNotificationTemplates] = useState('');
  const [message, setMessage] = useState(null); // Local message for form operations

  useEffect(() => {
    if (method) {
      setMethodId(method.id);
      setMethodName(method.name);
      setMethodCategory(method.category);
      setMinAmount(method.minAmount);
      setMaxAmount(method.maxAmount);
      setFee(method.fee);
      setFeeType(method.feeType);
      setIconUrl(method.iconUrl || '');
      setNotificationTemplates(method.notificationTemplates.join('\n') || '');

      if (method.category === 'QRIS') {
        setFormType('qris');
        setQrisName(method.qrisName || '');
        setQrisString(method.qrisString || '');
        setQrisUrl(method.qrisUrl || '');
      } else {
        setFormType('bank_ewallet');
        setAccountNumber(method.accountNumber || '');
        setAccountName(method.accountName || '');
      }
    } else {
      // Reset form for add mode
      resetFormState();
    }
  }, [method]);

  const resetFormState = () => {
    setFormType('bank_ewallet');
    setMethodId('');
    setMethodName('');
    setMethodCategory('Bank');
    setAccountNumber('');
    setAccountName('');
    setQrisName('');
    setQrisString('');
    setQrisUrl('');
    setMinAmount(0);
    setMaxAmount(0);
    setFee(0);
    setFeeType('Fixed');
    setIconUrl('');
    setNotificationTemplates('');
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const payload = {
      id: methodId,
      name: methodName,
      minAmount: parseFloat(minAmount),
      maxAmount: parseFloat(maxAmount),
      fee: parseFloat(fee),
      feeType: feeType,
      iconUrl: iconUrl,
      notificationTemplates: notificationTemplates.split('\n').map(line => line.trim()).filter(line => line),
    };

    if (formType === 'qris') {
      payload.category = 'QRIS';
      payload.qrisName = qrisName;
      payload.qrisString = qrisString;
      payload.qrisUrl = qrisUrl;
    } else {
      payload.category = methodCategory;
      payload.accountNumber = accountNumber;
      payload.accountName = accountName;
    }

    try {
      const apiEndpoint = method ? `/api/member/payment/edit/${method._id}` : '/api/member/payment/add';
      const apiMethod = method ? 'PUT' : 'POST';

      const res = await fetch(apiEndpoint, {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        onSave(); // Trigger refresh in parent
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  // Helper functions for checking e-wallet/bank/QRIS
  const handleCheckEwallet = async () => {
    setMessage(null);
    if (!accountNumber || !methodCategory) {
      setMessage({ type: 'error', text: 'Nomor HP dan kategori e-wallet harus diisi.' });
      return;
    }
    try {
      const res = await fetch('/api/member/payment/check-ewallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: accountNumber, ewalletType: methodCategory.toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccountName(data.name);
        setMessage({ type: 'success', text: `Nama ditemukan: ${data.name}` });
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal memeriksa nama e-wallet.' });
      }
    } catch (error) {
      console.error('Error checking e-wallet:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleCheckBank = async () => {
    setMessage(null);
    if (!accountNumber || !methodCategory) {
      setMessage({ type: 'error', text: 'Nomor rekening dan kode bank harus diisi.' });
      return;
    }
    try {
      const res = await fetch('/api/member/payment/check-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: accountNumber, code: methodCategory.toLowerCase() }), // Assuming methodCategory is bank code
      });
      const data = await res.json();
      if (res.ok) {
        setAccountName(data.result.name);
        setMessage({ type: 'success', text: `Nama ditemukan: ${data.result.name}` });
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal memeriksa nama rekening.' });
      }
    } catch (error) {
      console.error('Error checking bank:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleVerifyQris = async () => {
    setMessage(null);
    if (!qrisUrl) {
      setMessage({ type: 'error', text: 'URL QRIS harus diisi.' });
      return;
    }
    try {
      const res = await fetch('/api/member/payment/verify-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrisUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setQrisString(data.qrisString);
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal memverifikasi QRIS.' });
      }
    } catch (error) {
      console.error('Error verifying QRIS:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold mb-3">
        {method ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
      </h3>

      <Notification message={message} />

      {!method && ( // Only show type selection for new methods
        <div>
          <label htmlFor="formType" className="block text-sm font-medium text-gray-700">Tipe Metode</label>
          <select
            id="formType"
            name="formType"
            value={formType}
            onChange={(e) => { setFormType(e.target.value); resetFormState(); }}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="bank_ewallet">Bank / E-wallet</option>
            <option value="qris">QRIS</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="methodId" className="block text-sm font-medium text-gray-700">ID Pembayaran (unik)</label>
        <input
          type="text"
          id="methodId"
          name="methodId"
          value={methodId}
          onChange={(e) => setMethodId(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
          disabled={!!method} // ID tidak bisa diubah saat edit
        />
      </div>

      <div>
        <label htmlFor="methodName" className="block text-sm font-medium text-gray-700">Nama Tampilan</label>
        <input
          type="text"
          id="methodName"
          name="methodName"
          value={methodName}
          onChange={(e) => setMethodName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>

      {formType === 'bank_ewallet' && (
        <>
          <div>
            <label htmlFor="methodCategory" className="block text-sm font-medium text-gray-700">Kategori</label>
            <select
              id="methodCategory"
              name="methodCategory"
              value={methodCategory}
              onChange={(e) => setMethodCategory(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="Bank">Bank</option>
              <option value="Ewallet">E-wallet</option>
            </select>
          </div>
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Nomor Rekening/HP</label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={methodCategory === 'Ewallet' ? handleCheckEwallet : handleCheckBank}
                className="mt-1 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cek
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">Nama Pemilik Rekening/Akun</label>
            <input
              type="text"
              id="accountName"
              name="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </>
      )}

      {formType === 'qris' && (
        <>
          <div>
            <label htmlFor="qrisName" className="block text-sm font-medium text-gray-700">Nama QRIS</label>
            <input
              type="text"
              id="qrisName"
              name="qrisName"
              value={qrisName}
              onChange={(e) => setQrisName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="qrisUrl" className="block text-sm font-medium text-gray-700">URL Gambar QRIS</label>
            <div className="flex space-x-2">
              <input
                type="url"
                id="qrisUrl"
                name="qrisUrl"
                value={qrisUrl}
                onChange={(e) => setQrisUrl(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={handleVerifyQris}
                className="mt-1 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Verifikasi
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="qrisString" className="block text-sm font-medium text-gray-700">String QRIS (dari verifikasi)</label>
            <textarea
              id="qrisString"
              name="qrisString"
              value={qrisString}
              onChange={(e) => setQrisString(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows="3"
              required
              readOnly
            ></textarea>
          </div>
        </>
      )}

      <div>
        <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700">Jumlah Minimum (Rp)</label>
        <input
          type="number"
          id="minAmount"
          name="minAmount"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="0"
        />
      </div>
      <div>
        <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700">Jumlah Maksimum (Rp)</label>
        <input
          type="number"
          id="maxAmount"
          name="maxAmount"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="0"
        />
      </div>
      <div>
        <label htmlFor="fee" className="block text-sm font-medium text-gray-700">Biaya</label>
        <input
          type="number"
          id="fee"
          name="fee"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min="0"
        />
      </div>
      <div>
        <label htmlFor="feeType" className="block text-sm font-medium text-gray-700">Tipe Biaya</label>
        <select
          id="feeType"
          name="feeType"
          value={feeType}
          onChange={(e) => setFeeType(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="Fixed">Fixed</option>
          <option value="Persen">Persen</option>
        </select>
      </div>
      <div>
        <label htmlFor="iconUrl" className="block text-sm font-medium text-gray-700">URL Ikon (opsional)</label>
        <input
          type="url"
          id="iconUrl"
          name="iconUrl"
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="notificationTemplates" className="block text-sm font-medium text-gray-700">Template Notifikasi (per baris)</label>
        <textarea
          id="notificationTemplates"
          name="notificationTemplates"
          value={notificationTemplates}
          onChange={(e) => setNotificationTemplates(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          rows="3"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Batal
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {method ? 'Perbarui Metode' : 'Tambah Metode'}
        </button>
      </div>
    </form>
  );
}
