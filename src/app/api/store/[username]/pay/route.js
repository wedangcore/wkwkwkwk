import { NextResponse } from 'next/server';
import User from '@/models/user'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB
import { logApiRequest } from '@/middleware/logApiRequest'; // Asumsi Anda memiliki middleware logging
import axios from 'axios'; // Untuk memanggil API internal

export async function POST(request, { params }) {
    await connectToDatabase(); // Hubungkan ke DB

    const { username } = params;
    const requestBody = await request.json();
    const { amount, paymentMethodId } = requestBody;

    // Log API Request (adaptasi dari logApiRequest Express.js)
    // Karena ini adalah API publik, kita mungkin tidak memiliki apikey di sini.
    // Anda bisa menyesuaikan logApiRequest untuk mencatat permintaan tanpa apikey
    // atau hanya mencatat jika ada apikey yang valid.
    try {
        const logEntry = {
            timestamp: new Date(),
            method: request.method,
            endpoint: request.url,
            ipAddress: request.headers.get('x-forwarded-for') || request.ip,
            requestBody: JSON.stringify(requestBody, null, 2),
            responseStatus: null,
            responseBody: null,
        };
        // Jika Anda ingin menyimpan log ini ke user yang terkait dengan toko,
        // Anda perlu mencari user (merchant) terlebih dahulu.
        // Untuk saat ini, kita hanya mencatatnya di konsol atau sistem logging terpusat.
        console.log(`[API LOG] Store Pay Request for ${username}:`, logEntry);
    } catch (logError) {
        console.error('Gagal menyimpan Log API untuk Store Pay:', logError);
    }

    try {
        const merchant = await User.findOne({ username: username });
        if (!merchant) {
            return NextResponse.json({ success: false, message: 'Toko tidak valid.' }, { status: 404 });
        }

        const method = merchant.paymentMethods.find(m => m.id === paymentMethodId && m.isEnabled);
        if (!method) {
            return NextResponse.json({ success: false, message: 'Metode pembayaran tidak valid atau tidak aktif.' }, { status: 400 });
        }

        // Tentukan endpoint API internal berdasarkan kategori metode
        const categoryEndpoint = method.category.toLowerCase(); // 'qris', 'ewallet', atau 'bank'
        // Panggil API internal menggunakan URL absolut
        const apiUrl = `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}/api/payment/${categoryEndpoint}`;

        // Siapkan body untuk dikirim ke API internal
        const apiBody = {
            action: "create",
            apikey: merchant.apiKey, // Gunakan API Key merchant untuk membuat transaksi
            amount: amount,
            paymentMethod: paymentMethodId
        };

        // Panggil API internal
        const apiResponse = await axios.post(apiUrl, apiBody);

        // Jika API internal merespons dengan sukses dan memberikan paymentUrl
        if (apiResponse.data && apiResponse.data.success && apiResponse.data.data.paymentUrl) {
            // Mengembalikan URL pembayaran untuk redirect di sisi klien
            return NextResponse.json({ success: true, paymentUrl: apiResponse.data.data.paymentUrl }, { status: 200 });
        } else {
            // Jika API internal gagal, kembalikan pesan error dari API tersebut
            return NextResponse.json({ success: false, message: apiResponse.data.message || 'Gagal membuat transaksi.' }, { status: apiResponse.status || 500 });
        }

    } catch (error) {
        console.error("Error processing payment from store:", error);
        // Tangani jika error berasal dari axios (API internal)
        if (error.response && error.response.data && error.response.data.message) {
            return NextResponse.json({ success: false, message: error.response.data.message }, { status: error.response.status || 500 });
        } else {
            return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal, silakan coba lagi.' }, { status: 500 });
        }
    }
}
