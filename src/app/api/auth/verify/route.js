import { NextResponse } from 'next/server';
import User from '@/models/user'; // Pastikan path benar
import { sendVerificationCode } from '@/services/mailer'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB

export async function POST(request) {
    await connectToDatabase(); // Hubungkan ke DB

    const { email, code, action } = await request.json();

    if (!email) {
        return NextResponse.json({ success: false, message: 'Email wajib diisi.' }, { status: 400 });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 });
        }

        if (action === 'resend') {
            // Logika untuk mengirim ulang kode verifikasi
            if (user.isVerified) {
                return NextResponse.json({ success: false, message: 'Akun sudah diverifikasi.' }, { status: 400 });
            }

            // Cooldown 1 menit untuk mencegah spam email
            const now = Date.now();
            // Anda perlu menyimpan lastResendTime di user model atau di cache/session
            // Untuk contoh ini, kita asumsikan ada field lastVerificationResend di model User
            if (user.lastVerificationResend && (now - user.lastVerificationResend.getTime() < 60 * 1000)) {
                return NextResponse.json({ success: false, message: 'Silakan tunggu 1 menit sebelum mengirim ulang kode.' }, { status: 429 }); // 429 Too Many Requests
            }

            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            const newExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

            user.verificationCode = newCode;
            user.verificationExpires = newExpires;
            user.lastVerificationResend = new Date(); // Update timestamp resend
            await user.save();

            const mailStatus = await sendVerificationCode(user.email, newCode);
            if (mailStatus === 'error') {
                console.error('Failed to resend verification email:', user.email);
                return NextResponse.json({ success: false, message: 'Gagal mengirim ulang kode verifikasi. Coba lagi nanti.' }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: `Kode verifikasi baru telah dikirim ke ${user.email}.` }, { status: 200 });

        } else if (action === 'verify') {
            // Logika untuk memverifikasi kode
            if (!code) {
                return NextResponse.json({ success: false, message: 'Kode verifikasi wajib diisi.' }, { status: 400 });
            }

            if (user.isVerified) {
                return NextResponse.json({ success: false, message: 'Akun sudah diverifikasi.' }, { status: 400 });
            }

            if (user.verificationCode !== code || user.verificationExpires < Date.now()) {
                return NextResponse.json({ success: false, message: 'Kode verifikasi tidak valid atau telah kedaluwarsa.' }, { status: 400 });
            }

            user.isVerified = true;
            user.verificationCode = undefined;
            user.verificationExpires = undefined;
            user.lastVerificationResend = undefined; // Reset resend timestamp setelah verifikasi
            await user.save();

            return NextResponse.json({ success: true, message: 'Akun berhasil diverifikasi! Silakan login.' }, { status: 200 });

        } else {
            return NextResponse.json({ success: false, message: 'Aksi tidak valid. Gunakan "verify" atau "resend".' }, { status: 400 });
        }

    } catch (error) {
        console.error('Verification API error:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
    }
}
