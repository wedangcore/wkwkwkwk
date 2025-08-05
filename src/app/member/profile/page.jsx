// src/app/member/profile/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [baseUrl, setBaseUrl] = useState('');

  // Form states for profile info
  const [name, setName] = useState('');
  const [noTelp, setNoTelp] = useState('');

  // Form states for store info
  const [storeName, setStoreName] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');

  useEffect(() => {
    fetchUserData();
    setBaseUrl(window.location.origin);
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setName(data.user.name);
        setNoTelp(data.user.no_telp);
        setStoreName(data.user.store?.name || '');
        setStoreLogoUrl(data.user.store?.logoUrl || '');
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data profil.' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfileInfo = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/member/profile/update', { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_info', name, no_telp: noTelp }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData();
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
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/member/profile/update', { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_store_info', storeName, storeLogoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData();
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
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/member/profile/update', { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_api_key' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error regenerating API Key:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat profil...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Profil Pengguna</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Informasi Umum */}
      <div className="mb-8 border-b pb-6">
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
      <div className="mb-8 border-b pb-6">
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
      <div className="mb-8">
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
