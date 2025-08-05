// src/app/member/documentation/page.jsx
'use client';

import React, { useState, useEffect } from 'react';

export default function DocumentationPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    fetchUserData();
    setBaseUrl(window.location.origin); // Dapatkan base URL dari browser
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/me');
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

  if (loading) {
    return <div className="text-center py-8">Memuat dokumentasi...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Dokumentasi API</h2>

      {message.text && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">API Key Anda:</h3>
        <p className="bg-gray-100 p-3 rounded-md font-mono text-sm break-all">
          {user?.apiKey || 'Tidak ada API Key'}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Gunakan API Key ini untuk otentikasi setiap permintaan ke endpoint API.
        </p>
      </div>

      <div className="space-y-8">
        {/* Endpoint 1: Get Payment List */}
        <div>
          <h3 className="text-xl font-semibold mb-2">1. Get Payment List</h3>
          <p className="text-gray-700 mb-2">Mendapatkan daftar metode pembayaran yang tersedia dan aktif.</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">POST {baseUrl}/api/payment/list</p>
          <h4 className="font-medium mt-3 mb-1">Request Body:</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "apikey": "${user?.apiKey || 'YOUR_API_KEY'}"
}`}</code>
          </pre>
          <h4 className="font-medium mt-3 mb-1">Response (Success):</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "success": true,
  "message": "Berhasil menampilkan list ID Payment.",
  "data": {
    "Bank": [
      {
        "id": "bca",
        "name": "Bank BCA",
        "minAmount": 10000,
        "maxAmount": 5000000,
        "fee": 2500,
        "feeType": "Fixed",
        "accountNumber": "1234567890",
        "accountName": "Nama Pemilik BCA"
      }
    ],
    "Ewallet": [
      {
        "id": "dana",
        "name": "DANA",
        "minAmount": 5000,
        "maxAmount": 1000000,
        "fee": 1.5,
        "feeType": "Persen",
        "accountNumber": "081234567890",
        "accountName": "Nama Pemilik DANA"
      }
    ],
    "QRIS": [
      {
        "id": "qris_static",
        "name": "QRIS Statis",
        "minAmount": 1000,
        "maxAmount": 2000000,
        "fee": 0,
        "feeType": "Fixed",
        "qrisName": "Nama Merchant QRIS",
        "qrisUrl": "https://example.com/qris.png",
        "qrisString": "000201010212..."
      }
    ]
  }
}`}</code>
          </pre>
        </div>

        {/* Endpoint 2: Create Bank Payment */}
        <div>
          <h3 className="text-xl font-semibold mb-2">2. Create Bank Payment</h3>
          <p className="text-gray-700 mb-2">Membuat instruksi pembayaran via transfer bank.</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">POST {baseUrl}/api/payment/bank</p>
          <h4 className="font-medium mt-3 mb-1">Request Body:</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "action": "create",
  "apikey": "${user?.apiKey || 'YOUR_API_KEY'}",
  "amount": 50000,
  "paymentMethod": "bca" // ID metode dari "Get Payment List"
}`}</code>
          </pre>
          <h4 className="font-medium mt-3 mb-1">Response (Success):</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "success": true,
  "message": "Instruksi pembayaran berhasil dibuat",
  "data": {
    "transactionId": "TRX-1678888888888",
    "paymentUrl": "${baseUrl}/payment/encrypted_id_here",
    "amount": 52500, // Jumlah total termasuk biaya dan unik
    "paymentMethod": "bca",
    "accountNumber": "1234567890",
    "ownerName": "Nama Pemilik BCA",
    "expiredAt": "2023-03-15T10:15:00.000Z"
  }
}`}</code>
          </pre>
        </div>

        {/* Endpoint 3: Create E-wallet Payment */}
        <div>
          <h3 className="text-xl font-semibold mb-2">3. Create E-wallet Payment</h3>
          <p className="text-gray-700 mb-2">Membuat instruksi pembayaran via e-wallet.</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">POST {baseUrl}/api/payment/ewallet</p>
          <h4 className="font-medium mt-3 mb-1">Request Body:</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "action": "create",
  "apikey": "${user?.apiKey || 'YOUR_API_KEY'}",
  "amount": 20000,
  "paymentMethod": "dana" // ID metode dari "Get Payment List"
}`}</code>
          </pre>
          <h4 className="font-medium mt-3 mb-1">Response (Success):</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "success": true,
  "message": "Instruksi pembayaran berhasil dibuat",
  "data": {
    "transactionId": "TRX-1678888888889",
    "paymentUrl": "${baseUrl}/payment/encrypted_id_here",
    "amount": 20300, // Jumlah total termasuk biaya dan unik
    "paymentMethod": "dana",
    "accountNumber": "081234567890",
    "ownerName": "Nama Pemilik DANA",
    "expiredAt": "2023-03-15T10:15:00.000Z"
  }
}`}</code>
          </pre>
        </div>

        {/* Endpoint 4: Create QRIS Payment */}
        <div>
          <h3 className="text-xl font-semibold mb-2">4. Create QRIS Payment</h3>
          <p className="text-gray-700 mb-2">Membuat QRIS untuk pembayaran.</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">POST {baseUrl}/api/payment/qris</p>
          <h4 className="font-medium mt-3 mb-1">Request Body:</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "action": "create",
  "apikey": "${user?.apiKey || 'YOUR_API_KEY'}",
  "amount": 15000,
  "paymentMethod": "qris_static" // ID metode dari "Get Payment List"
}`}</code>
          </pre>
          <h4 className="font-medium mt-3 mb-1">Response (Success):</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "success": true,
  "message": "QRIS berhasil dibuat",
  "data": {
    "transactionId": "TRX-1678888888890",
    "paymentUrl": "${baseUrl}/payment/encrypted_id_here",
    "amount": 15123, // Jumlah total termasuk biaya dan unik
    "paymentMethod": "qris_static",
    "qr_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "qr_url": "https://cdn.wbk.web.id/qris-image.png",
    "expiredAt": "2023-03-15T10:15:00.000Z"
  }
}`}</code>
          </pre>
        </div>

        {/* Endpoint 5: Check Transaction Status */}
        <div>
          <h3 className="text-xl font-semibold mb-2">5. Check Transaction Status</h3>
          <p className="text-gray-700 mb-2">Mengecek status transaksi berdasarkan ID transaksi.</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">GET {baseUrl}/api/payment/bank/status/:transactionId</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">GET {baseUrl}/api/payment/ewallet/status/:transactionId</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">GET {baseUrl}/api/payment/qris/status/:transactionId</p>
          <h4 className="font-medium mt-3 mb-1">Response (Success):</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "success": true,
  "message": "detail Traksaksi ditemukan",
  "data": {
    "transactionId": "TRX-1678888888888",
    "status": "pending", // atau "sukses", "gagal"
    "amount": 52500,
    "method": "bca"
  }
}`}</code>
          </pre>
        </div>

        {/* Endpoint 6: Webhook for Payment Update */}
        <div>
          <h3 className="text-xl font-semibold mb-2">6. Webhook for Payment Update</h3>
          <p className="text-gray-700 mb-2">Endpoint untuk menerima notifikasi pembayaran dari aplikasi pihak ketiga (misal MacroDroid).</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">POST {baseUrl}/api/payment/bank</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">POST {baseUrl}/api/payment/ewallet</p>
          <p className="font-mono bg-gray-100 p-2 rounded-md inline-block text-sm">POST {baseUrl}/api/payment/qris</p>
          <h4 className="font-medium mt-3 mb-1">Request Body:</h4>
          <p className="text-gray-700 mb-2">
            Body ini akan dikirim oleh aplikasi seperti MacroDroid. Pastikan `notification` berisi nominal angka yang sesuai dengan transaksi pending.
          </p>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "action": "update",
  "apikey": "${user?.apiKey || 'YOUR_API_KEY'}",
  "app": "MacroDroid", // atau nama aplikasi lain
  "notification": "Pembayaran masuk sebesar Rp 52500 dari Budi." // Contoh notifikasi
}`}</code>
          </pre>
          <h4 className="font-medium mt-3 mb-1">Response (Success):</h4>
          <pre className="bg-gray-800 text-white p-3 rounded-md text-sm overflow-x-auto">
            <code>{`{
  "success": true,
  "message": "Status transaksi berhasil diperbarui."
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
