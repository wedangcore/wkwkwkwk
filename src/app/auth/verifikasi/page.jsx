// src/app/auth/verifikasi/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifikasiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown in seconds

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, action: 'verify' }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        router.push(`/auth/login?success_message=${encodeURIComponent(data.message)}`);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
    }
  };

  const handleResend = async () => {
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, action: 'resend' }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setResendCooldown(60); // Start 60-second cooldown
      } else {
        setMessage({ type: 'error', text: data.message });
        if (res.status === 429) { // Too Many Requests
          setResendCooldown(60); // Set cooldown if rate-limited
        }
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleVerify}>
      {message.text && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            readOnly // Email should not be editable here
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email"
            value={email}
          />
        </div>
        <div>
          <label htmlFor="code" className="sr-only">Kode Verifikasi</label>
          <input
            id="code"
            name="code"
            type="text"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Kode Verifikasi"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Verifikasi Akun
        </button>
      </div>

      <div className="text-center text-sm">
        Tidak menerima kode?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={`font-medium ${resendCooldown > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-500'}`}
        >
          Kirim ulang kode {resendCooldown > 0 && `(${resendCooldown}s)`}
        </button>
      </div>
    </form>
  );
}
