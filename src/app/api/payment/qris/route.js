import { NextResponse } from 'next/server';
import axios from 'axios';
import User from '@/models/user'; // Pastikan path benar
import { encrypt } from '@/lib/encryption'; // Pastikan path benar
import { sendTelegramMessage } from '@/services/mailer'; // Pastikan path benar
import { uploadToWbk } from '@/lib/uploader/cdnwbk'; // Pastikan path benar
import { connectToDatabase } from '@/lib/mongodb'; // Asumsi Anda memiliki helper koneksi DB
import { logApiRequest } from '@/middleware/logApiRequest'; // Asumsi Anda memiliki middleware logging

export async function POST(request) {
    await connectToDatabase(); // Hubungkan ke DB

    const requestBody = await request.json();
    const { action, amount, apikey, app, notification, paymentMethod } = requestBody;

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

    switch (action) {
        case 'create':
            try {
                if (!paymentMethod) {
                    return NextResponse.json({ success: false, message: "Parameter 'paymentMethod' untuk ID QRIS dibutuhkan." }, { status: 400 });
                }

                const method = user.paymentMethods.find(m => m.id === paymentMethod && m.category === 'QRIS' && m.isEnabled);
                if (!method) {
                    return NextResponse.json({ success: false, message: `Metode pembayaran QRIS dengan ID '${paymentMethod}' tidak aktif atau tidak ditemukan.` }, { status: 400 });
                }

                const qris_statis = method.qrisString;
                if (!qris_statis) {
                    return NextResponse.json({ success: false, message: "String QRIS statis untuk metode ini belum diatur." }, { status: 400 });
                }

                const baseAmount = parseInt(amount);

                if (!baseAmount || isNaN(baseAmount) || baseAmount <= 0) {
                    return NextResponse.json({ success: false, message: "Parameter 'amount' harus berupa angka positif yang valid." }, { status: 400 });
                }
                if (method.minAmount > 0 && baseAmount < method.minAmount) {
                    return NextResponse.json({ success: false, message: `Jumlah transaksi minimum adalah Rp ${method.minAmount.toLocaleString('id-ID')}.` }, { status: 400 });
                }
                if (method.maxAmount > 0 && baseAmount > method.maxAmount) {
                    return NextResponse.json({ success: false, message: `Jumlah transaksi maksimum adalah Rp ${method.maxAmount.toLocaleString('id-ID')}.` }, { status: 400 });
                }

                const feeAmount = (method.feeType === 'Persen')
                    ? Math.round(baseAmount * (method.fee / 100))
                    : (method.fee || 0);

                let finalAmount;
                let uniqueNumber;
                let isDuplicate;
                do {
                    uniqueNumber = Math.floor(Math.random() * 499) + 1;
                    finalAmount = baseAmount + feeAmount + uniqueNumber;
                    const duplicateTx = user.riwayatTransaksi.find(tx => tx.status === 'pending' && tx.amount === finalAmount);
                    isDuplicate = !!duplicateTx;
                } while (isDuplicate);

                const qrApi = "https://qrisku.my.id/api";
                const payload = { amount: finalAmount, qris_statis: qris_statis };
                const qrResponse = await axios.post(qrApi, payload, { headers: { "Content-Type": "application/json" } });

                if (!qrResponse.data || !qrResponse.data.qris_base64) {
                    return NextResponse.json({ success: false, message: "Gagal membuat QRIS dari API eksternal." }, { status: 500 });
                }

                const qrBase64 = qrResponse.data.qris_base64;
                const qrBuffer = Buffer.from(qrBase64, 'base64');
                const fileName = `qris-${user.username}-${Date.now()}.png`;
                const qrUrl = await uploadToWbk(qrBuffer, fileName);

                const newTransactionId = `TRX-${Date.now()}`;
                const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);

                const encryptedId = encrypt(newTransactionId);
                const paymentUrl = `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}/payment/${encryptedId}`;

                const newTransaction = {
                    transactionId: newTransactionId,
                    baseAmount: baseAmount,
                    feeAmount: feeAmount,
                    uniqueNumber: uniqueNumber,
                    amount: finalAmount,
                    status: 'pending',
                    description: `Pembayaran via QRIS`,
                    paymentMethod: method.id,
                    paymentUrl: paymentUrl,
                    qr_base64: qrBase64,
                    qr_url: qrUrl,
                    expiredAt: fifteenMinutesFromNow
                };

                user.riwayatTransaksi.push(newTransaction);
                user.transaksi.pending += 1;
                user.transaksi.total += 1;
                user.transaksi.uang_pending += finalAmount;
                await user.save();

                // Set timeout untuk kedaluwarsa transaksi (lihat catatan di bank/route.js)

                return NextResponse.json({
                    success: true,
                    message: "QRIS berhasil dibuat",
                    data: {
                        transactionId: newTransactionId,
                        paymentUrl: paymentUrl,
                        amount: finalAmount,
                        paymentMethod: method.id,
                        qr_base64: qrBase64,
                        qr_url: qrUrl,
                        expiredAt: fifteenMinutesFromNow.toISOString()
                    }
                }, { status: 200 });
            } catch (error) {
                console.error("QRIS creation error:", error);
                return NextResponse.json({ success: false, message: "Terjadi kesalahan saat membuat QRIS." }, { status: 500 });
            }

        case 'update':
            if (!app || !notification) {
                return NextResponse.json({ success: false, message: 'Body request harus berisi apikey, action, app, dan notification.' }, { status: 400 });
            }
            try {
                const notificationString = notification.toString();
                const nominalMatch = notificationString.match(/(\d[\d.,]*)/);
                if (!nominalMatch) {
                    return NextResponse.json({ success: false, message: 'Tidak ada nominal angka dalam notifikasi.' }, { status: 400 });
                }
                const nominalFromNotif = parseInt(nominalMatch[0].replace(/[.,]/g, ''));

                const txToUpdate = user.riwayatTransaksi.find(
                    tx => tx.status === 'pending' && tx.amount === nominalFromNotif
                );

                if (!txToUpdate) {
                    console.log(`Webhook (QRIS): Tidak ada transaksi pending untuk user ${user.username} dengan nominal ${nominalFromNotif}.`);
                    return NextResponse.json({ success: true, message: 'Tidak ada transaksi yang cocok untuk diupdate.' }, { status: 200 });
                }

                txToUpdate.status = 'sukses';
                user.transaksi.sukses += 1;
                user.transaksi.pending -= 1;
                user.transaksi.uang_sukses_hari_ini += txToUpdate.amount;
                user.transaksi.uang_sukses_bulan_ini += txToUpdate.amount;
                user.transaksi.uang_pending -= txToUpdate.amount;
                user.transaksi.uang_sukses_total += txToUpdate.amount;
                user.transaksi.omset_total += (txToUpdate.feeAmount + txToUpdate.uniqueNumber);
                await user.save();

                if (user.telegram.token_bot && user.telegram.chat_id) {
                    const notifMessage = `✅ *Pembayaran QRIS Berhasil Diterima*\n\n*ID Transaksi:* \`${txToUpdate.transactionId}\`\n*Jumlah:* *Rp ${txToUpdate.amount.toLocaleString('id-ID')}*\n*Tanggal:* ${new Date().toLocaleString('id-ID')}\n\nTerima kasih!`;
                    await sendTelegramMessage(user.telegram.token_bot, user.telegram.chat_id, notifMessage);
                }
                console.log(`Webhook (QRIS): Transaksi ${txToUpdate.transactionId} untuk ${user.username} diupdate.`);
                return NextResponse.json({ success: true, message: 'Status transaksi berhasil diperbarui.' }, { status: 200 });
            } catch (error) {
                console.error("QRIS Webhook Error:", error);
                return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server saat webhook.' }, { status: 500 });
            }

        default:
            return NextResponse.json({ message: "Aksi tidak valid. Gunakan 'create' atau 'update'." }, { status: 400 });
    }
}
