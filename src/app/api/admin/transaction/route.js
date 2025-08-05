import { NextResponse } from 'next/server';
import User from '@/models/user'; // Pastikan path benar
import Web from '@/models/web';   // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB
// import { checkAdmin } from '@/middleware/auth'; // Anda perlu membuat middleware/helper ini

// Helper untuk memeriksa apakah pengguna adalah admin (sama seperti di admin/member/route.js)
async function checkAdmin(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { isAdmin: false, message: 'Unauthorized' };
    }
    const token = authHeader.split(' ')[1];

    try {
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // const user = await User.findById(decoded.id);
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
        const allUsers = await User.find({ 'riwayatTransaksi.0': { $exists: true } }).select('username riwayatTransaksi');
        let allTransactions = [];
        allUsers.forEach(user => {
            user.riwayatTransaksi.forEach(tx => {
                allTransactions.push({ ...tx.toObject(), owner: user.username });
            });
        });

        allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const webData = await Web.getSingleton();

        return NextResponse.json({
            success: true,
            transactions: allTransactions,
            webData: webData,
            message: 'Data transaksi berhasil diambil.'
        }, { status: 200 });

    } catch (error) {
        console.error("Admin transaction API error:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
    }
}
