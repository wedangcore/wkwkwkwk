// src/app/auth/forgot-password/page.jsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleReCaptchaProvider, GoogleReCaptcha } from 'react-google-recaptcha-v3';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function ForgotPasswordPageContent() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [executeRecaptcha, setExecuteRecaptcha] = useState(false);
  const router = useRouter();

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    setExecuteRecaptcha(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!recaptchaToken) {
      setExecuteRecaptcha(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, action: 'request_reset', recaptchaToken }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        // Tidak perlu redirect, cukup tampilkan pesan
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Forgot password request error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
    } finally {
      setRecaptchaToken('');
      setExecuteRecaptcha(true);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Masukkan Email Anda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Kirim Link Reset
        </button>
      </div>

      <div className="text-center text-sm">
        <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Kembali ke Login
        </Link>
      </div>

      {RECAPTCHA_SITE_KEY && (
        <GoogleReCaptcha
          onVerify={handleRecaptchaChange}
          executeRecaptcha={executeRecaptcha}
        />
      )}
    </form>
  );
}

export default function ForgotPasswordPage() {
  if (!RECAPTCHA_SITE_KEY) {
    console.error("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined. reCAPTCHA will not work.");
    return (
      <div className="text-center text-red-500">
        Error: reCAPTCHA site key not configured.
        <ForgotPasswordPageContent />
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <ForgotPasswordPageContent />
    </GoogleReCaptchaProvider>
  );
}
