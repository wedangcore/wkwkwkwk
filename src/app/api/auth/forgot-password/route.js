import { NextResponse } from 'next/server';
import crypto from 'crypto';
import passwordValidator from 'password-validator';
import User from '@/models/user'; // Pastikan path benar
import ResetToken from '@/models/resetTokens'; // Pastikan path benar
import { sendResetEmail } from '@/services/mailer'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB

// Inisialisasi validator password untuk reset
const resetpw = new passwordValidator();
resetpw
    .is().min(8)
    .is().max(30)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces()
    .is().not().oneOf(['Passw0rd', 'Password123']);

export async function POST(request) {
    await connectToDatabase(); // Hubungkan ke DB

    const { email, password, confirmpassword, token, action, recaptchaToken } = await request.json();

    // --- Verifikasi reCAPTCHA (Server-Side) ---
    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaToken}`;

    try {
        const recaptchaResponse = await fetch(recaptchaVerifyUrl, { method: 'POST' });
        const recaptchaData = await recaptchaResponse.json();

        if (!recaptchaData.success || recaptchaData.score < 0.5) {
            console.warn('reCAPTCHA verification failed:', recaptchaData);
            return NextResponse.json({ success: false, message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.' }, { status: 400 });
        }
    } catch (recaptchaError) {
        console.error('Error verifying reCAPTCHA:', recaptchaError);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat memverifikasi reCAPTCHA.' }, { status: 500 });
    }

    if (action === 'request_reset') {
        // Logika untuk meminta reset password
        if (!email) {
            return NextResponse.json({ success: false, message: 'Email wajib diisi.' }, { status: 400 });
        }

        try {
            const userData = await User.findOne({ email: email.toLowerCase() });
            if (!userData) {
                return NextResponse.json({ success: false, message: 'Tidak ada user dengan email tersebut.' }, { status: 404 });
            }

            const cooldown = await ResetToken.findOne({ email: email.toLowerCase() });
            if (cooldown) {
                return NextResponse.json({ success: false, message: 'Permintaan reset password sudah dikirim. Silakan tunggu 30 menit sebelum mencoba lagi.' }, { status: 429 });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const mailStatus = await sendResetEmail(email.toLowerCase(), resetToken);

            if (mailStatus === 'error') {
                return NextResponse.json({ success: false, message: 'Gagal mengirim email reset password. Silakan coba lagi nanti.' }, { status: 500 });
            }

            await new ResetToken({ token: resetToken, email: email.toLowerCase() }).save();

            return NextResponse.json({ success: true, message: 'Link reset password telah dikirim ke email Anda. Periksa kotak masuk Anda.' }, { status: 200 });

        } catch (error) {
            console.error('Forgot password request API error:', error);
            return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
        }

    } else if (action === 'reset_password') {
        // Logika untuk mereset password dengan token
        if (!password || !confirmpassword || !email || !token) {
            return NextResponse.json({ success: false, message: 'Semua kolom wajib diisi.' }, { status: 400 });
        }
        if (password !== confirmpassword) {
            return NextResponse.json({ success: false, message: 'Password tidak cocok!' }, { status: 400 });
        }
        if (!resetpw.validate(password)) {
            return NextResponse.json({ success: false, message: 'Password harus mengandung setidaknya satu angka, satu huruf besar dan kecil, dan minimal 8 karakter atau lebih, tanpa emoji dan spasi, maksimal 30 karakter.' }, { status: 400 });
        }

        try {
            const checkToken = await ResetToken.findOne({ token: token, email: email.toLowerCase() });
            if (!checkToken) {
                return NextResponse.json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' }, { status: 400 });
            }

            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 });
            }

            const salt = await bcryptjs.genSalt(12);
            const hash = await bcryptjs.hash(password, salt);

            user.password = hash;
            await user.save();

            await ResetToken.findOneAndDelete({ token: token });

            return NextResponse.json({ success: true, message: 'Password berhasil diubah. Silakan login.' }, { status: 200 });

        } catch (error) {
            console.error('Reset password API error:', error);
            return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
        }

    } else {
        return NextResponse.json({ success: false, message: 'Aksi tidak valid. Gunakan "request_reset" atau "reset_password".' }, { status: 400 });
    }
}
