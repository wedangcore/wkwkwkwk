const mongoose = require('mongoose');
const crypto = require('crypto');

// Schema for a single user-defined payment method
const paymentMethodSchema = new mongoose.Schema({
    id: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['Ewallet', 'Bank', 'QRIS'], required: true }, // Ditambah QRIS
    accountNumber: { type: String }, // Tidak lagi required
    accountName: { type: String }, // Tidak lagi required
    qrisName: { type: String, default: null },
    qrisUrl: { type: String, default: null },
    qrisString: { type: String, default: null }, 
    iconUrl: { type: String, default: null },
    minAmount: { type: Number, default: 0 },
    maxAmount: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    feeType: { type: String, enum: ['Fixed', 'Persen'], default: 'Fixed' },
    notificationTemplates: [{ type: String }],
    isEnabled: { type: Boolean, default: true }
}, { timestamps: true });

// Schema for a single transaction (no changes)
const singleTransactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true },
    description: { type: String, default: 'Pembayaran Produk' },
    baseAmount: { type: Number },
    feeAmount: { type: Number, default: 0 },
    uniqueNumber: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'sukses', 'gagal'], default: 'pending' },
    paymentMethod: { type: String, default: null },
    paymentUrl: { type: String, default: null },
    qr_base64: { type: String, default: null },
    qr_url: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    expiredAt: { type: Date }
}, { _id: false });

// Updated transaction summary schema
const transaksiSummarySchema = new mongoose.Schema({
    sukses: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    gagal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    uang_pending: { type: Number, default: 0 },
    uang_sukses_hari_ini: { type: Number, default: 0 },
    uang_sukses_kemarin: { type: Number, default: 0 },
    uang_sukses_bulan_ini: { type: Number, default: 0 },
    uang_sukses_total: { type: Number, default: 0 },
    omset_total: { type: Number, default: 0 }
}, { _id: false });

// DITAMBAHKAN: Schema for a single API request log
const apiRequestLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    method: { type: String },
    endpoint: { type: String },
    requestBody: { type: String },
    responseStatus: { type: Number },
    responseBody: { type: String },
    ipAddress: { type: String }
}, { _id: false });

// Main user schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    no_telp: { type: String, required: true },
    password: { type: String, required: true },
    apiKey: { type: String, unique: true },
    expired: { type: Date, default: null },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationExpires: { type: Date, default: null },
    store: {
        name: { type: String, default: null },
        logoUrl: { type: String, default: null }
    },
    telegram: {
        token_bot: { type: String, default: null },
        chat_id: { type: String, default: null }
    },
    paymentMethods: [paymentMethodSchema],
    transaksi: {
        type: transaksiSummarySchema,
        default: () => ({})
    },
    riwayatTransaksi: [singleTransactionSchema],
    apiRequestLogs: [apiRequestLogSchema]
}, { timestamps: true });

userSchema.pre('save', function(next) {
    if (this.isNew && !this.apiKey) {
        this.apiKey = crypto.randomBytes(24).toString('hex');
    }
    next();
});

module.exports = mongoose.model('User', userSchema);