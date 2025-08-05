// src/app/auth/reset-password/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleReCaptchaProvider, GoogleReCaptcha } from 'react-google-recaptcha-v3';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmpassword, setConfirmpassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [executeRecaptcha, setExecuteRecaptcha] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Token reset password tidak ditemukan.' });
      // Opsional: Redirect setelah beberapa detik
      // setTimeout(() => router.push('/auth/forgot-password'), 3000);
    }
    // Anda mungkin ingin memanggil API untuk memvalidasi token di sini
    // dan mendapatkan email yang terkait dengan token tersebut.
    // Untuk saat ini, kita asumsikan token valid dan email akan diisi dari API.
    // Atau, jika email tidak dikirim via URL, Anda bisa meminta user memasukkannya.
    // Untuk kesederhanaan, kita akan biarkan email kosong dan user akan memasukkannya.
    // Namun, lebih aman jika email didapatkan dari validasi token di server.
    // Jika email ada di token, API forgot-password/route.js akan mengembalikannya.
  }, [token, router]);

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

    if (!token) {
      setMessage({ type: 'error', text: 'Token reset password tidak valid.' });
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', { // Menggunakan API yang sama
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmpassword,
          token,
          action: 'reset_password',
          recaptchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        router.push(`/auth/login?success_message=${encodeURIComponent(data.message)}`);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
    } finally {
      setRecaptchaToken('');
      setExecuteRecaptcha(true);
    }
  };

  if (!token) {
    return (
      <div className="text-center text-red-500">
        Token reset password tidak ditemukan atau tidak valid.
        <div className="mt-4">
          <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Minta link reset baru
          </Link>
        </div>
      </div>
    );
  }

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
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email Anda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password Baru</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password Baru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirmpassword" className="sr-only">Konfirmasi Password Baru</label>
          <input
            id="confirmpassword"
            name="confirmpassword"
            type="password"
            autoComplete="new-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Konfirmasi Password Baru"
            value={confirmpassword}
            onChange={(e) => setConfirmpassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Reset Password
        </button>
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

export default function ResetPasswordPage() {
  if (!RECAPTCHA_SITE_KEY) {
    console.error("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined. reCAPTCHA will not work.");
    return (
      <div className="text-center text-red-500">
        Error: reCAPTCHA site key not configured.
        <ResetPasswordPageContent />
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <ResetPasswordPageContent />
    </GoogleReCaptchaProvider>
  );
}
