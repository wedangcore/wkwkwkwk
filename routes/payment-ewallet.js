const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Web = require('../model/web');
const mailer = require('../controller/sendMail');
const { encrypt } = require('./help/payment-url'); 
const logApiRequest = require('./help/log-api');

router.post('/payment/ewallet', logApiRequest, async (req, res) => {
    console.log(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Menerima request ke /payment/ewallet:`, req.body);
    const { action, amount, apikey, paymentMethod, notification, app } = req.body;

    if (!apikey) {
        return res.status(401).json({ success: false, message: 'Otentikasi gagal. Parameter "apikey" dibutuhkan.' });
    }

    let user;
    try {
        user = await User.findOne({ apiKey: apikey });
        if (!user) {
            return res.status(401).json({ success: false, message: 'API Key tidak valid.' });
        }
    } catch (error) {
        console.error("Database error during user lookup:", error);
        return res.status(500).json({ success: false, message: 'Kesalahan internal server.' });
    }

    switch (action) {
        case 'create':
            try {
                if (!paymentMethod) {
                     return res.status(400).json({ success: false, message: "Parameter 'paymentMethod' dibutuhkan." });
                }
                
                const method = user.paymentMethods.find(m => m.id === paymentMethod && m.category === 'Ewallet');

                if (!method || !method.isEnabled) {
                    return res.status(400).json({ success: false, message: `Metode e-wallet '${paymentMethod}' tidak ditemukan atau tidak aktif.` });
                }
                
                const baseAmount = parseInt(amount);

                // ==> LOGIC IMPROVEMENT 1: MIN/MAX AMOUNT VALIDATION
                if (!baseAmount || isNaN(baseAmount) || baseAmount <= 0) {
                    return res.status(400).json({ success: false, message: "Parameter 'amount' harus berupa angka positif yang valid." });
                }
                if (method.minAmount > 0 && baseAmount < method.minAmount) {
                    return res.status(400).json({ success: false, message: `Jumlah transaksi minimum adalah Rp ${method.minAmount.toLocaleString('id-ID')}.` });
                }
                if (method.maxAmount > 0 && baseAmount > method.maxAmount) {
                    return res.status(400).json({ success: false, message: `Jumlah transaksi maksimum adalah Rp ${method.maxAmount.toLocaleString('id-ID')}.` });
                }
                
                const feeAmount = (method.feeType === 'Persen')
                    ? Math.round(baseAmount * (method.fee / 100))
                    : (method.fee || 0);
                
                // ==> LOGIC IMPROVEMENT 2: ENSURE UNIQUE FINAL AMOUNT FOR PENDING TRANSACTIONS
                let finalAmount;
                let uniqueNumber;
                let isDuplicate;
                do {
                    uniqueNumber = Math.floor(Math.random() * 499) + 1;
                    finalAmount = baseAmount + feeAmount + uniqueNumber;
                    const duplicateTx = user.riwayatTransaksi.find(tx => tx.status === 'pending' && tx.amount === finalAmount);
                    isDuplicate = !!duplicateTx;
                } while (isDuplicate);
                
                const newTransactionId = `TRX-${Date.now()}`;
                const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
                
                // Encrypt the transaction ID to create a public URL
                const encryptedId = encrypt(newTransactionId);
                const paymentUrl = `${req.protocol}://${req.get('host')}/payment/${encryptedId}`;

                const newTransaction = {
                    transactionId: newTransactionId,
                    baseAmount: baseAmount,
                    feeAmount: feeAmount,
                    uniqueNumber: uniqueNumber,
                    amount: finalAmount,
                    status: 'pending',
                    description: `Pembayaran via E-wallet (${method.name})`,
                    paymentMethod: method.id,
                    paymentUrl: paymentUrl,
                    expiredAt: fifteenMinutesFromNow
                };

                user.riwayatTransaksi.push(newTransaction);
                user.transaksi.pending += 1;
                user.transaksi.total += 1;
                user.transaksi.uang_pending += finalAmount;
                await user.save();

                setTimeout(async () => {
                    try {
                        const userToCheck = await User.findById(user._id);
                        const txToExpire = userToCheck.riwayatTransaksi.find(tx => tx.transactionId === newTransactionId && tx.status === 'pending');
                        if (txToExpire) {
                            txToExpire.status = 'gagal';
                            userToCheck.transaksi.pending -= 1;
                            userToCheck.transaksi.gagal += 1;
                            userToCheck.transaksi.uang_pending -= txToExpire.amount;
                            await userToCheck.save();
                            console.log(`Transaksi E-wallet ${newTransactionId} telah kedaluwarsa.`);
                        }
                    } catch (err) {
                        console.error(`Gagal mengupdate transaksi E-wallet kedaluwarsa ${newTransactionId}:`, err);
                    }
                }, 15 * 60 * 1000);

                res.json({
                    success: true,
                    message: "Instruksi pembayaran berhasil dibuat",
                    data: {
                        transactionId: newTransactionId,
                        paymentUrl: paymentUrl,
                        amount: finalAmount,
                        paymentMethod: method.id,
                        accountNumber: method.accountNumber,
                        ownerName: method.accountName,
                        expiredAt: fifteenMinutesFromNow.toISOString()
                    }
                });
            } catch (error) {
                console.error("E-wallet creation error:", error);
                res.status(500).json({ success: false, message: "Terjadi kesalahan saat membuat instruksi pembayaran." });
            }
            break;

        case 'update': 
            if (!app || !notification) {
                return res.status(400).json({ success: false, message: 'Body request harus berisi apikey, action, app, dan notification.' });
            }
            try {
                const nominalMatch = notification.toString().match(/(\d[\d.,]*)/);
                if (!nominalMatch) {
                    return res.status(400).json({ success: false, message: 'Tidak ada nominal angka dalam notifikasi.' });
                }
                const nominalFromNotif = parseInt(nominalMatch[0].replace(/[.,]/g, ''));
                
                const txToUpdate = user.riwayatTransaksi.find(
                    tx => tx.status === 'pending' && tx.amount === nominalFromNotif
                );

                if (!txToUpdate) {
                    console.log(`Webhook (E-wallet): Tidak ada transaksi pending untuk ${user.username} dengan nominal ${nominalFromNotif}.`);
                    return res.status(200).json({ success: true, message: 'Tidak ada transaksi yang cocok.' });
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
                    const notifMessage = `✅ *Pembayaran E-wallet Berhasil*\n\n*ID Transaksi:* \`${txToUpdate.transactionId}\`\n*Jumlah:* *Rp ${txToUpdate.amount.toLocaleString('id-ID')}*\n*Metode:* ${txToUpdate.paymentMethod.toUpperCase()}\n*Tanggal:* ${new Date().toLocaleString('id-ID')}\n\nTerima kasih!`;
                    await mailer.sendTelegramMessage(user.telegram.token_bot, user.telegram.chat_id, notifMessage);
                }
                console.log(`Webhook (E-wallet): Transaksi ${txToUpdate.transactionId} untuk ${user.username} diupdate.`);
                res.status(200).json({ success: true, message: 'Status transaksi berhasil diperbarui.' });
            } catch (error) {
                console.error("E-wallet Webhook Error:", error);
                res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat webhook.' });
            }
            break;
        default:
            res.status(400).json({ message: "Aksi tidak valid. Gunakan 'create' atau 'update'." });
            break;
    }
});

router.get('/payment/ewallet/status/:transactionId', logApiRequest, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const userWithTransaction = await User.findOne({ 'riwayatTransaksi.transactionId': transactionId });
        if (!userWithTransaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }
        const transaction = userWithTransaction.riwayatTransaksi.find(trx => trx.transactionId === transactionId);
        if (transaction) {
            res.status(200).json({
                success: true,
                message: "Detail transaksi ditemukan",
                data: {
                    transactionId: transaction.transactionId,
                    status: transaction.status,
                    amount: transaction.amount,
                    method: transaction.paymentMethod
                }
            });
        } else {
             res.status(404).json({ success: false, message: 'Detail transaksi tidak ditemukan.' });
        }
    } catch (error) {
        console.error("E-wallet status check error:", error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});


module.exports = router;