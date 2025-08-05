// src/services/mailer.js
import nodemailer from 'nodemailer';
import { hostemail, sendemail, pwsendemail, fromsendemail, domain } from '../settings'; // Pastikan path benar

const smtpTransport = nodemailer.createTransport({
  host: hostemail,
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: sendemail,
    pass: pwsendemail,
  },
});

export const sendResetEmail = async (email, token) => {
  const url = `https://${domain}/auth/reset-password?token=${token}`;
  const mailOptions = {
    from: fromsendemail,
    to: email,
    subject: "RESET KATA SANDI",
    html: `
      <div>
        <h2>Reset Kata Sandi Anda</h2>
        <p>Anda menerima email ini karena ada permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah untuk melanjutkan.</p>
        <a href="${url}">Reset Kata Sandi</a>
      </div>
    `,
  };

  return new Promise((resolve, reject) => {
    smtpTransport.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`[!] Warning SMTP error: ${error}`);
        return reject('error');
      }
      resolve(info);
    });
  });
};

export const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: fromsendemail,
    to: email,
    subject: "Kode Verifikasi Akun",
    html: `
      <div>
        <h2>Verifikasi Akun Anda</h2>
        <p>Gunakan kode di bawah ini untuk mengaktifkan akun Anda:</p>
        <strong>${code}</strong>
      </div>
    `,
  };

  return new Promise((resolve, reject) => {
    smtpTransport.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`[!] Warning SMTP error: ${error}`);
        return reject('error');
      }
      resolve(info);
    });
  });
};

// Tambahkan fungsi lain untuk mengirim email sesuai kebutuhan
