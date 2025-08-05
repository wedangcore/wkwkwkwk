// src/services/paymentService.js
import User from '@/models/user'; // Pastikan path benar
import { encrypt } from './encryption'; // Pastikan path benar

export const createTransaction = async (userId, paymentMethod, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User  tidak ditemukan.');

  const newTransactionId = `TRX-${Date.now()}`;
  const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
  const encryptedId = encrypt(newTransactionId);

  const newTransaction = {
    transactionId: newTransactionId,
    amount,
    paymentMethod,
    status: 'pending',
    expiredAt: fifteenMinutesFromNow,
  };

  user.riwayatTransaksi.push(newTransaction);
  await user.save();

  return {
    transactionId: newTransactionId,
    paymentUrl: `${process.env.BASE_URL}/payment/${encryptedId}`,
    expiredAt: fifteenMinutesFromNow,
  };
};

export const updateTransactionStatus = async (userId, transactionId, newStatus) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User  tidak ditemukan.');

  const transaction = user.riwayatTransaksi.find(tx => tx.transactionId === transactionId);
  if (!transaction) throw new Error('Transaksi tidak ditemukan.');

  transaction.status = newStatus;
  await user.save();
};
