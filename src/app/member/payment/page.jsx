// src/app/member/payment/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function PaymentPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add-bank-ewallet', 'add-qris'
  const [editMethod, setEditMethod] = useState(null); // Untuk menyimpan metode yang sedang diedit

  // Form states for adding/editing
  const [formType, setFormType] = useState('bank_ewallet'); // 'bank_ewallet' or 'qris'
  const [methodId, setMethodId] = useState('');
  const [methodName, setMethodName] = useState('');
  const [methodCategory, setMethodCategory] = useState('Bank'); // 'Bank', 'Ewallet', 'QRIS'
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
        setMessage({ type: 'error', text: 'Gagal memuat data pengguna.' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

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
      payload.formType = 'qris';
      payload.category = 'QRIS';
      payload.qrisName = qrisName;
      payload.qrisString = qrisString;
      payload.qrisUrl = qrisUrl;
    } else {
      payload.formType = 'bank_ewallet';
      payload.category = methodCategory;
      payload.accountNumber = accountNumber;
      payload.accountName = accountName;
    }

    try {
      const res = await fetch('/api/member/payment/add', { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData(); // Refresh data
        resetForm();
        setActiveTab('list');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error adding method:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleEditMethod = (method) => {
    setEditMethod(method);
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
    setActiveTab('add-bank-ewallet'); // Atau tab yang sesuai untuk edit
  };

  const handleUpdateMethod = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const payload = {
      id: methodId,
      name: methodName,
      category: methodCategory,
      minAmount: parseFloat(minAmount),
      maxAmount: parseFloat(maxAmount),
      fee: parseFloat(fee),
      feeType: feeType,
      iconUrl: iconUrl,
      notificationTemplates: notificationTemplates.split('\n').map(line => line.trim()).filter(line => line),
    };

    if (formType === 'qris') {
      payload.qrisName = qrisName;
      payload.qrisString = qrisString;
      payload.qrisUrl = qrisUrl;
      payload.accountNumber = ''; // Clear if changing to QRIS
      payload.accountName = '';
    } else {
      payload.accountNumber = accountNumber;
      payload.accountName = accountName;
      payload.qrisName = ''; // Clear if changing to Bank/Ewallet
      payload.qrisString = '';
      payload.qrisUrl = '';
    }

    try {
      const res = await fetch(`/api/member/payment/edit/${editMethod._id}`, { // Asumsi Anda membuat API ini
        method: 'PUT', // Atau POST, tergantung implementasi API Anda
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData();
        resetForm();
        setEditMethod(null);
        setActiveTab('list');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error updating method:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleToggleStatus = async (methodIdToToggle, currentStatus) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/member/payment/update/${methodIdToToggle}`, { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', isEnabled: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleDeleteMethod = async (methodIdToDelete) => {
    if (!confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) {
      return;
    }
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/member/payment/update/${methodIdToDelete}`, { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error deleting method:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const resetForm = () => {
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
    setEditMethod(null);
  };

  if (loading) {
    return <div className="text-center py-8">Memuat metode pembayaran...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Manajemen Metode Pembayaran</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => { setActiveTab('list'); resetForm(); }}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Daftar Metode
          </button>
          <button
            onClick={() => { setActiveTab('add-bank-ewallet'); resetForm(); setFormType('bank_ewallet'); }}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'add-bank-ewallet'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tambah Bank/E-wallet
          </button>
          <button
            onClick={() => { setActiveTab('add-qris'); resetForm(); setFormType('qris'); }}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'add-qris'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tambah QRIS
          </button>
        </nav>
      </div>

      {activeTab === 'list' && (
        <div>
          {user?.paymentMethods.length === 0 ? (
            <p className="text-gray-600">Belum ada metode pembayaran yang ditambahkan.</p>
          ) : (
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
                  {user?.paymentMethods.map((method) => (
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
                          onClick={() => handleEditMethod(method)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(method._id, method.isEnabled)}
                          className={`text-sm ${method.isEnabled ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} mr-3`}
                        >
                          {method.isEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => handleDeleteMethod(method._id)}
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
          )}
        </div>
      )}

      {(activeTab === 'add-bank-ewallet' || activeTab === 'add-qris') && (
        <form onSubmit={editMethod ? handleUpdateMethod : handleAddMethod} className="space-y-4">
          <h3 className="text-xl font-semibold mb-3">
            {editMethod ? 'Edit Metode Pembayaran' : `Tambah Metode ${formType === 'qris' ? 'QRIS' : 'Bank/E-wallet'}`}
          </h3>

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
              disabled={!!editMethod} // ID tidak bisa diubah saat edit
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
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
                {/* Tambahkan tombol cek e-wallet/bank di sini */}
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
                <input
                  type="url"
                  id="qrisUrl"
                  name="qrisUrl"
                  value={qrisUrl}
                  onChange={(e) => setQrisUrl(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
                {/* Tambahkan tombol verifikasi QRIS di sini */}
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
                  readOnly // Biasanya diisi otomatis dari verifikasi
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
              onClick={() => { resetForm(); setActiveTab('list'); }}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editMethod ? 'Perbarui Metode' : 'Tambah Metode'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
