// src/app/member/log-request/page.jsx
'use client';

import React, { useState, useEffect } from 'react';

export default function LogRequestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/me'); // Asumsi API ini mengembalikan data user lengkap dengan apiRequestLogs
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat log permintaan.' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat log permintaan...</div>;
  }

  const sortedLogs = user?.apiRequestLogs
    ? [...user.apiRequestLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Log Permintaan API</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {sortedLogs.length === 0 ? (
        <p className="text-gray-600">Belum ada log permintaan API.</p>
      ) : (
        <div className="space-y-4">
          {sortedLogs.map((log, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">{log.method} {log.endpoint}</span>
                <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
              </div>
              <div className="text-sm text-gray-700 mb-2">
                <p><strong>IP:</strong> {log.ipAddress}</p>
                <p><strong>Status Respons:</strong> <span className={`font-bold ${
                  log.responseStatus >= 200 && log.responseStatus < 300 ? 'text-green-600' : 'text-red-600'
                }`}>{log.responseStatus}</span></p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Request Body:</h4>
                  <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-x-auto">
                    <code>{log.requestBody ? JSON.stringify(JSON.parse(log.requestBody), null, 2) : 'N/A'}</code>
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Response Body:</h4>
                  <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-x-auto">
                    <code>{log.responseBody ? JSON.stringify(JSON.parse(log.responseBody), null, 2) : 'N/A'}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
