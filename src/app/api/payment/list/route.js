import { NextResponse } from 'next/server';
import User from '@/models/user'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB
import { logApiRequest } from '@/middleware/logApiRequest'; // Asumsi Anda memiliki middleware logging

export async function POST(request) {
    await connectToDatabase(); // Hubungkan ke DB

    const requestBody = await request.json();
    const { apikey } = requestBody;

    if (!apikey) {
        return NextResponse.json({ success: false, message: 'Otentikasi gagal. Parameter "apikey" dibutuhkan.' }, { status: 401 });
    }

    let user;
    try {
        user = await User.findOne({ apiKey: apikey });
        if (!user) {
            return NextResponse.json({ success: false, message: 'API Key tidak valid.' }, { status: 401 });
        }
    } catch (error) {
        console.error("Database error during user lookup:", error);
        return NextResponse.json({ success: false, message: 'Kesalahan internal server.' }, { status: 500 });
    }

    // Log API Request setelah user ditemukan
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
        user.apiRequestLogs.push(logEntry);
        if (user.apiRequestLogs.length > 100) {
            user.apiRequestLogs.shift();
        }
        await user.save();
    } catch (logError) {
        console.error('Gagal menyimpan Log API:', logError);
    }

    try {
        const enabledMethods = user.paymentMethods.filter(method => method.isEnabled);

        const groupedMethods = enabledMethods.reduce((acc, method) => {
            const category = method.category;
            if (!acc[category]) {
                acc[category] = [];
            }

            const methodData = {
                id: method.id,
                name: method.name,
                minAmount: method.minAmount,
                maxAmount: method.maxAmount,
                fee: method.fee,
                feeType: method.feeType
            };

            if (category === 'QRIS') {
                methodData.qrisName = method.qrisName;
                methodData.qrisUrl = method.qrisUrl;
                methodData.qrisString = method.qrisString;
            } else {
                methodData.accountNumber = method.accountNumber;
                methodData.accountName = method.accountName;
            }

            acc[category].push(methodData);
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            message: "Berhasil menampilkan list ID Payment.",
            data: groupedMethods
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching payment list:", error);
        return NextResponse.json({ success: false, message: 'Kesalahan internal server.' }, { status: 500 });
    }
}
