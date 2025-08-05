// src/app/admin/setting/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Web from '@/models/web'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB

export default function SettingPage() {
  const [webData, setWebData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  useEffect(() => {
    fetchWebData();
  }, []);

  const fetchWebData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setting'); // Asumsi Anda membuat API ini
      if (res.ok) {
        const data = await res.json();
        setWebData(data.webData);
        setName(data.webData.name);
        setIconUrl(data.webData.iconUrl);
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data pengaturan.' });
      }
    } catch (error) {
      console.error('Error fetching web data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/setting', { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, iconUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchWebData(); // Refresh data
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat pengaturan...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Pengaturan Website</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdateSettings} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Website</label>
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
          <label htmlFor="iconUrl" className="block text-sm font-medium text-gray-700">URL Ikon Website</label>
          <input
            type="url"
            id="iconUrl"
            name="iconUrl"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
