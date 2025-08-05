import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import User from '@/models/user'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB

export async function POST(request) {
    await connectToDatabase(); // Hubungkan ke DB

    const { username, password } = await request.json();

    if (!username || !password) {
        return NextResponse.json({ success: false, message: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    try {
        // Logika untuk mencari user berdasarkan email ATAU username
        const query = (username.includes('@'))
            ? { email: username.toLowerCase() }
            : { username: username };

        const user = await User.findOne(query);

        if (!user) {
            return NextResponse.json({ success: false, message: 'Username atau email tidak terdaftar.' }, { status: 401 });
        }

        // Cocokkan password
        const isMatch = await bcryptjs.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json({ success: false, message: 'Password salah.' }, { status: 401 });
        }

        if (!user.isVerified) {
            // Jika belum diverifikasi, berikan pesan dan mungkin arahkan ke halaman verifikasi
            // Di sini, kita hanya mengembalikan status, klien yang akan mengarahkan
            return NextResponse.json({ success: false, message: 'Akun Anda belum diverifikasi. Silakan cek email Anda untuk kode verifikasi.', needsVerification: true, email: user.email }, { status: 403 });
        }

        // Login berhasil
        // Di sini Anda bisa membuat JWT atau session token dan mengembalikannya
        // Untuk contoh ini, kita hanya mengembalikan data user yang relevan
        const userData = {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            apiKey: user.apiKey // Hati-hati mengembalikan API Key langsung ke klien
        };

        return NextResponse.json({ success: true, message: 'Login berhasil!', user: userData }, { status: 200 });

    } catch (error) {
        console.error('Login API error:', error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
    }
}
