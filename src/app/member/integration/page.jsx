// src/app/member/integration/page.jsx
'use client';

import React, { useState, useEffect } from 'react';

export default function IntegrationPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

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
        setTelegramToken(data.user.telegram?.token_bot || '');
        setTelegramChatId(data.user.telegram?.chat_id || '');
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data integrasi.' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTelegramSettings = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/member/integration/telegram', { // Asumsi Anda membuat API ini
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_bot: telegramToken, chat_id: telegramChatId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserData(); // Refresh data
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error saving Telegram settings:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat pengaturan integrasi...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Integrasi</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Integrasi Telegram</h3>
        <p className="text-gray-600 mb-4">
          Hubungkan bot Telegram Anda untuk menerima notifikasi transaksi secara real-time.
        </p>
        <form onSubmit={handleSaveTelegramSettings} className="space-y-4">
          <div>
            <label htmlFor="telegramToken" className="block text-sm font-medium text-gray-700">Token Bot Telegram</label>
            <input
              type="text"
              id="telegramToken"
              name="telegramToken"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Contoh: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            />
          </div>
          <div>
            <label htmlFor="telegramChatId" className="block text-sm font-medium text-gray-700">Chat ID Telegram</label>
            <input
              type="text"
              id="telegramChatId"
              name="telegramChatId"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Contoh: 123456789 atau -1234567890"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Simpan Pengaturan Telegram
          </button>
        </form>
      </div>
    </div>
  );
}
