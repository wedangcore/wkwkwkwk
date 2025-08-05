// src/components/admin/WebsiteSettingsForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Notification from '@/components/common/Notification'; // Asumsi path benar

export default function WebsiteSettingsForm({ webData, onSave }) {
  const [name, setName] = useState(webData?.name || '');
  const [iconUrl, setIconUrl] = useState(webData?.iconUrl || '');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setName(webData?.name || '');
    setIconUrl(webData?.iconUrl || '');
  }, [webData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('/api/admin/setting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, iconUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        onSave(); // Trigger refresh in parent
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Notification message={message} />

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
  );
}
