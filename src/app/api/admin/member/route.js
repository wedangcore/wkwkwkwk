import { NextResponse } from 'next/server';
import User from '@/models/user'; // Pastikan path benar
import Web from '@/models/web';   // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB
// import { checkAdmin } from '@/middleware/auth'; // Anda perlu membuat middleware/helper ini

// Helper untuk memeriksa apakah pengguna adalah admin
// Di Next.js API Routes, Anda akan memeriksa token atau session di sini.
async function checkAdmin(request) {
    // Implementasi autentikasi admin Anda di sini.
    // Contoh: Memverifikasi JWT dari header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { isAdmin: false, message: 'Unauthorized' };
    }
    const token = authHeader.split(' ')[1];

    try {
        // Verifikasi token (misalnya dengan JWT.verify)
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // const user = await User.findById(decoded.id);
        // if (user && user.isAdmin) {
        //     return { isAdmin: true, user: user };
        // }
        // Placeholder: Asumsikan token valid dan user adalah admin
        const user = await User.findOne({ /* kriteria admin dari token */ }); // Ganti dengan logika nyata
        if (user && user.isAdmin) {
             return { isAdmin: true, user: user };
        }
        return { isAdmin: false, message: 'Akses ditolak. Akun bukan administrator.' };
    } catch (error) {
        console.error('Admin authentication error:', error);
        return { isAdmin: false, message: 'Token tidak valid atau kedaluwarsa.' };
    }
}

export async function GET(request) {
    await connectToDatabase(); // Hubungkan ke DB

    const authResult = await checkAdmin(request);
    if (!authResult.isAdmin) {
        return NextResponse.json({ success: false, message: authResult.message }, { status: 403 });
    }

    try {
        const members = await User.find({}).sort({ createdAt: -1 }).select('-password'); // Jangan kirim password
        const webData = await Web.getSingleton();

        return NextResponse.json({
            success: true,
            members: members,
            webData: webData,
            message: 'Data member berhasil diambil.'
        }, { status: 200 });

    } catch (error) {
        console.error("Admin member API error:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
    }
}
