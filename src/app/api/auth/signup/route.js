import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import passwordValidator from 'password-validator';
import containsEmoji from 'contains-emoji';
import isGmail from 'is-gmail';
import User from '@/models/user'; // Pastikan path benar
import Web from '@/models/web';   // Pastikan path benar
import { sendVerificationCode, sendTelegramMessage } from '@/services/mailer'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB

// Inisialisasi validator password
const createpw = new passwordValidator();
createpw
    .is().min(8)
    .is().max(30)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces()
    .is().not().oneOf(['Passw0rd', 'Password123']);

export async function POST(request) {
    await connectToDatabase(); // Hubungkan ke DB

    const { name, no_telp, password, confirmpassword, email, username, recaptchaToken } = await request.json();

    // --- Validasi Input ---
    if (!name || !email || !username || !no_telp || !password || !confirmpassword) {
        return NextResponse.json({ success: false, message: 'Semua kolom wajib diisi!' }, { status: 400 });
    }
    if (password !== confirmpassword) {
        return NextResponse.json({ success: false, message: 'Password tidak cocok!' }, { status: 400 });
    }
    if (!createpw.validate(password)) {
        return NextResponse.json({ success: false, message: 'Password harus mengandung setidaknya satu angka, satu huruf besar dan kecil, dan minimal 8 karakter atau lebih, tanpa emoji dan spasi, maksimal 30 karakter.' }, { status: 400 });
    }
    if (containsEmoji(password)) {
        return NextResponse.json({ success: false, message: 'Password tidak boleh mengandung emoji.' }, { status: 400 });
    }
    if (username.length < 4 || username.length > 20) {
        return NextResponse.json({ success: false, message: 'Username harus minimal 4 karakter dan tidak boleh lebih dari 20 karakter!' }, { status: 400 });
    }
    if (containsEmoji(username)) {
        return NextResponse.json({ success: false, message: 'Username tidak diperbolehkan menggunakan emoji!' }, { status: 400 });
    }
    if (!isGmail(email)) {
        return NextResponse.json({ success: false, message: 'Masukkan alamat Gmail yang valid!' }, { status: 400 });
    }

    // --- Verifikasi reCAPTCHA (Server-Side) ---
    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaToken}`;

    try {
        const recaptchaResponse = await fetch(recaptchaVerifyUrl, { method: 'POST' });
        const recaptchaData = await recaptchaResponse.json();

        if (!recaptchaData.success || recaptchaData.score < 0.5) { // Sesuaikan score threshold sesuai kebutuhan
            console.warn('reCAPTCHA verification failed:', recaptchaData);
            return NextResponse.json({ success: false, message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.' }, { status: 400 });
        }
    } catch (recaptchaError) {
        console.error('Error verifying reCAPTCHA:', recaptchaError);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat memverifikasi reCAPTCHA.' }, { status: 500 });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username }] });
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'User dengan email atau username tersebut sudah ada.' }, { status: 409 }); // 409 Conflict
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

        const salt = await bcryptjs.genSalt(12);
        const hash = await bcryptjs.hash(password, salt);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            username,
            no_telp,
            password: hash,
            verificationCode,
            verificationExpires
        });

        await newUser.save();

        // Kirim kode verifikasi via email
        const mailStatus = await sendVerificationCode(newUser.email, verificationCode);
        if (mailStatus === 'error') {
            console.error('Failed to send verification email for new user:', newUser.email);
            // Anda bisa memilih untuk menghapus user atau menandainya untuk verifikasi manual
            // Untuk saat ini, kita biarkan dan biarkan user mencoba resend
        }

        // Update total user di Web data
        const webData = await Web.getSingleton();
        webData.total_user += 1;
        await webData.save();

        // Kirim notifikasi ke admin via Telegram (opsional)
        try {
            const admin = await User.findOne({ isAdmin: true });
            if (admin && admin.telegram.token_bot && admin.telegram.chat_id) {
                const notifMessage =
                    `👤 *Pengguna Baru Mendaftar*\n\n` +
                    `*Nama:* ${newUser.name}\n` +
                    `*Username:* \`${newUser.username}\`\n` +
                    `*Email:* ${newUser.email}\n` +
                    `*No. Telp:* ${newUser.no_telp}\n` +
                    `*Tanggal:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

                await sendTelegramMessage(
                    admin.telegram.token_bot,
                    admin.telegram.chat_id,
                    notifMessage
                );
            }
        } catch (notifError) {
            console.error("Gagal mengirim notifikasi pendaftaran ke admin:", notifError);
        }

        return NextResponse.json({ success: true, message: `Pendaftaran berhasil! Kode verifikasi telah dikirim ke ${newUser.email}.`, email: newUser.email }, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('Signup API error:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal pada server, silakan coba lagi.' }, { status: 500 });
    }
}
