// src/app/auth/login/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleReCaptchaProvider, GoogleReCaptcha } from 'react-google-recaptcha-v3';

// Pastikan ini sesuai dengan variabel lingkungan Anda
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function LoginPageContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [executeRecaptcha, setExecuteRecaptcha] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cek jika ada pesan dari redirect (misalnya setelah verifikasi)
    const params = new URLSearchParams(window.location.search);
    const successMsg = params.get('success_message');
    const errorMsg = params.get('error_message');

    if (successMsg) {
      setMessage({ type: 'success', text: successMsg });
      router.replace('/auth/login', undefined, { shallow: true }); // Hapus query param
    } else if (errorMsg) {
      setMessage({ type: 'error', text: errorMsg });
      router.replace('/auth/login', undefined, { shallow: true });
    }
  }, [router]);

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    setExecuteRecaptcha(false); // Reset untuk eksekusi berikutnya
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' }); // Clear previous messages

    if (!recaptchaToken) {
      setExecuteRecaptcha(true); // Minta reCAPTCHA untuk dieksekusi
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, recaptchaToken }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        // Redirect ke halaman member/payment setelah login berhasil
        router.push('/member/payment');
      } else {
        setMessage({ type: 'error', text: data.message });
        if (data.needsVerification) {
          // Jika akun belum diverifikasi, arahkan ke halaman verifikasi
          router.push(`/auth/verifikasi?email=${data.email}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan atau server.' });
    } finally {
      setRecaptchaToken(''); // Clear token setelah digunakan
      setExecuteRecaptcha(true); // Minta token baru untuk percobaan berikutnya
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
          <label htmlFor="username" className="sr-only">Username atau Email</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Username atau Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Lupa password?
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Masuk
        </button>
      </div>

      <div className="text-center text-sm">
        Belum punya akun?{' '}
        <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
          Daftar sekarang
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

export default function LoginPage() {
  if (!RECAPTCHA_SITE_KEY) {
    console.error("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined. reCAPTCHA will not work.");
    return (
      <div className="text-center text-red-500">
        Error: reCAPTCHA site key not configured.
        <LoginPageContent /> {/* Render content without reCAPTCHA */}
      </div>
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTcha_SITE_KEY}>
      <LoginPageContent />
    </GoogleReCaptchaProvider>
  );
}
