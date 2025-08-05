// src/app/layout.jsx
import './globals.css'; // Pastikan Anda memiliki file CSS global
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'WBK PayGateway',
  description: 'Sistem Pembayaran Terintegrasi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
