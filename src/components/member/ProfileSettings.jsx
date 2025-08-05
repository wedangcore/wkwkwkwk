// src/components/member/ProfileSettings.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Notification from '@/components/common/Notification'; // Asumsi path benar

export default function ProfileSettings({ user, onUpdateUser }) {
  const [name, setName] = useState(user?.name || '');
  const [noTelp, setNoTelp] = useState(user?.no_telp || '');
  const [storeName, setStoreName] = useState(user?.store?.name || '');
  const [storeLogoUrl, setStoreLogoUrl] = useState(user?.store?.logoUrl || '');
  const [message, setMessage] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setNoTelp(user?.no_telp || '');
    setStoreName(user?.store?.name || '');
    setStoreLogoUrl(user?.store?.logoUrl || '');
    setBaseUrl(window.location.origin);
  }, [user]);

  const handleUpdateProfileInfo = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch('/api/member/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_info', name, no_telp: noTelp }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        onUpdateUser(); // Trigger refresh in parent
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error updating profile info:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleUpdateStoreInfo = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch('/api/member/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_store_info', storeName, storeLogoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        onUpdateUser(); // Trigger refresh in parent
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error updating store info:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!confirm('Apakah Anda yakin ingin membuat API Key baru? API Key lama akan tidak valid.')) {
      return;
    }
    setMessage(null);
    try {
      const res = await fetch('/api/member/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_api_key' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        onUpdateUser(); // Trigger refresh in parent
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error regenerating API Key:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  return (
    <div className="space-y-8">
      <Notification message={message} />

      {/* Informasi Umum */}
      <div className="border-b pb-6">
        <h3 className="text-xl font-semibold mb-3">Informasi Umum</h3>
        <form onSubmit={handleUpdateProfileInfo} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={user?.email || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed sm:text-sm"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={user?.username || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed sm:text-sm"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="noTelp" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
            <input
              type="tel"
              id="noTelp"
              name="noTelp"
              value={noTelp}
              onChange={(e) => setNoTelp(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Perbarui Informasi
          </button>
        </form>
      </div>

      {/* Informasi Toko */}
      <div className="border-b pb-6">
        <h3 className="text-xl font-semibold mb-3">Informasi Toko</h3>
        <p className="text-gray-600 mb-4">
          URL Toko Anda: <Link href={`${baseUrl}/store/${user?.username}`} className="text-indigo-600 hover:underline">{baseUrl}/store/{user?.username}</Link>
        </p>
        <form onSubmit={handleUpdateStoreInfo} className="space-y-4">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">Nama Toko</label>
            <input
              type="text"
              id="storeName"
              name="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="storeLogoUrl" className="block text-sm font-medium text-gray-700">URL Logo Toko</label>
            <input
              type="url"
              id="storeLogoUrl"
              name="storeLogoUrl"
              value={storeLogoUrl}
              onChange={(e) => setStoreLogoUrl(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {storeLogoUrl && (
              <div className="mt-2">
                <Image src={storeLogoUrl} alt="Store Logo Preview" width={100} height={100} className="rounded-md" />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Perbarui Informasi Toko
          </button>
        </form>
      </div>

      {/* API Key */}
      <div>
        <h3 className="text-xl font-semibold mb-3">API Key</h3>
        <p className="bg-gray-100 p-3 rounded-md font-mono text-sm break-all mb-4">
          {user?.apiKey || 'Tidak ada API Key'}
        </p>
        <button
          onClick={handleRegenerateApiKey}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Buat Ulang API Key
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Membuat ulang API Key akan membuat API Key yang lama tidak valid.
        </p>
      </div>
    </div>
  );
}
