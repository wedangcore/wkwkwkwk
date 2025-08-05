// src/app/payment/status/[encryptedId]/route.js
import { NextResponse } from 'next/server';
import User from '@/models/user'; // Pastikan path benar
import { decrypt } from '@/lib/encryption'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB

export async function GET(request, { params }) {
    await connectToDatabase(); // Hubungkan ke DB

    const { encryptedId } = params;
    const transactionId = decrypt(encryptedId); // Dekripsi ID transaksi

    if (!transactionId) {
        return NextResponse.json({ success: false, message: 'ID transaksi tidak valid.' }, { status: 400 });
    }

    try {
        const userWithTransaction = await User.findOne({
            'riwayatTransaksi.transactionId': transactionId
        });

        if (!userWithTransaction) {
            return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan.' }, { status: 404 });
        }

        const transaction = userWithTransaction.riwayatTransaksi.find(
            trx => trx.transactionId === transactionId
        );

        if (transaction) {
            return NextResponse.json({
                success: true,
                message: "Detail transaksi ditemukan",
                data: {
                    transactionId: transaction.transactionId,
                    status: transaction.status,
                    amount: transaction.amount,
                    method: transaction.paymentMethod,
                    createdAt: transaction.createdAt,
                }
            }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: 'Detail transaksi tidak ditemukan.' }, { status: 404 });
        }
    } catch (error) {
        console.error("Public status check error:", error);
        return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server.' }, { status: 500 });
    }
}
