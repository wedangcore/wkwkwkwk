require('../settings');
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const qs = require('qs');
const Jimp = require('jimp');
const jsQR = require('jsqr');

const User = require('../model/user');
const Web = require('../model/web');
const authRoutes = require('./auth');
const mailer = require('../controller/sendMail');

const router = express.Router();

// Middleware to check if the user is authenticated
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    }
    req.flash('error_messages', "Silakan login untuk mengakses halaman ini.");
    res.redirect('/auth/login');
}

// Redirect root to the main member page
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/member/payment');
    } else {
        res.render("home");
    }
});

// Main Payment Page
router.get('/member/payment', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        res.render('member/payment', {
            user: user,
            webData: webData,
            page: 'payment',
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});
router.post('/member/payment/add', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { formType, id, name, category, accountNumber, accountName, qrisName, qrisString, qrisUrl, minAmount, maxAmount, fee, feeType, iconUrl, notificationTemplates } = req.body;
        if (Array.isArray(id)) id = id.find(val => val);
        if (Array.isArray(name)) name = name.find(val => val);
        if (!id || !name) {
             req.flash('error_messages', 'Field ID dan Nama Tampilan wajib diisi.');
             return res.redirect('/member/payment');
        }
        if (user.paymentMethods.some(method => method.id === id.toLowerCase())) {
            req.flash('error_messages', `ID Pembayaran '${id}' sudah ada. Silakan gunakan ID lain.`);
            return res.redirect('/member/payment');
        }
        let newMethodData = {
            id: id.toLowerCase().replace(/[^a-z0-9]/g, ''),
            name,
            minAmount: parseFloat(minAmount) || 0,
            maxAmount: parseFloat(maxAmount) || 0,
            fee: parseFloat(fee) || 0,
            feeType: feeType || 'Fixed',
            iconUrl,
            notificationTemplates: notificationTemplates ? notificationTemplates.split('\n').map(line => line.trim()).filter(line => line) : []
        };
        if (formType === 'qris') {
            newMethodData.category = 'QRIS';
            newMethodData.qrisName = qrisName;
            newMethodData.qrisString = qrisString;
            newMethodData.qrisUrl = qrisUrl;
        } else { // bank_ewallet
            if (!category || !accountNumber || !accountName) {
                req.flash('error_messages', 'Kategori, Nomor Rekening, dan Nama Pemilik wajib diisi.');
                return res.redirect('/member/payment');
            }
            newMethodData.category = category;
            newMethodData.accountNumber = accountNumber;
            newMethodData.accountName = accountName;
        }
        user.paymentMethods.push(newMethodData);
        await user.save();
        req.flash('success_messages', 'Metode pembayaran baru berhasil ditambahkan.');
        res.redirect('/member/payment');
    } catch (error) {
        console.error("Add payment method error:", error);
        req.flash('error_messages', 'Gagal menambahkan metode pembayaran.');
        res.redirect('/member/payment');
    }
});
router.post('/member/payment/edit/:methodId', checkAuth, async (req, res) => {
    try {
        const { methodId } = req.params;
        const user = await User.findById(req.user.id);
        const method = user.paymentMethods.id(methodId);
        if (!method) {
            req.flash('error_messages', 'Metode pembayaran tidak ditemukan.');
            return res.redirect('/member/payment');
        }
        const { id, name, category, accountNumber, accountName, qrisName, qrisString, qrisUrl, minAmount, maxAmount, fee, feeType, iconUrl, notificationTemplates } = req.body;
        if (!id || !name) {
            req.flash('error_messages', 'Field ID dan Nama Tampilan wajib diisi saat mengedit.');
            return res.redirect('/member/payment');
        }
        const sanitizedId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (user.paymentMethods.some(m => m.id === sanitizedId && m._id.toString() !== methodId)) {
            req.flash('error_messages', `ID Pembayaran '${id}' sudah digunakan oleh metode lain.`);
            return res.redirect('/member/payment');
        }
        // Update common fields
        method.id = sanitizedId;
        method.name = name;
        method.minAmount = parseFloat(minAmount) || 0;
        method.maxAmount = parseFloat(maxAmount) || 0;
        method.fee = parseFloat(fee) || 0;
        method.feeType = feeType || 'Fixed';
        method.iconUrl = iconUrl;
        method.notificationTemplates = notificationTemplates ? notificationTemplates.split('\n').map(line => line.trim()).filter(line => line) : [];
        // Update category-specific fields
        method.category = category;
        if (category === 'QRIS') {
            method.qrisName = qrisName;
            method.qrisString = qrisString;
            method.qrisUrl = qrisUrl;
            method.accountNumber = undefined;
            method.accountName = undefined;
        } else { // Bank or Ewallet
             if (!accountNumber || !accountName) {
                req.flash('error_messages', 'Nomor Rekening dan Nama Pemilik wajib diisi.');
                return res.redirect('/member/payment');
            }
            method.accountNumber = accountNumber;
            method.accountName = accountName;
            method.qrisName = undefined;
            method.qrisString = undefined;
            method.qrisUrl = undefined;
        }
        await user.save();
        req.flash('success_messages', `Metode pembayaran '${method.name}' berhasil diperbarui.`);
        res.redirect('/member/payment');
    } catch (error) {
        console.error("Edit payment method error:", error);
        req.flash('error_messages', 'Gagal memperbarui metode pembayaran.');
        res.redirect('/member/payment');
    }
});
router.post('/member/payment/update/:methodId', checkAuth, async (req, res) => {
    try {
        const { methodId } = req.params;
        const { action } = req.body;
        const user = await User.findById(req.user.id);
        const method = user.paymentMethods.id(methodId);
        if (!method) {
            req.flash('error_messages', 'Metode pembayaran tidak ditemukan.');
            return res.redirect('/member/payment');
        }
        if (action === 'toggle') {
            method.isEnabled = !method.isEnabled;
            await user.save();
            req.flash('success_messages', `Status ${method.name} berhasil diubah.`);
        } else if (action === 'delete') {
            method.remove();
            await user.save();
            req.flash('success_messages', `Metode pembayaran ${method.name} telah dihapus.`);
        }
        res.redirect('/member/payment');
    } catch (error) {
        console.error("Update payment method error:", error);
        req.flash('error_messages', 'Gagal memperbarui metode pembayaran.');
        res.redirect('/member/payment');
    }
});
router.post('/member/payment/check-ewallet', checkAuth, async (req, res) => {
    let { phoneNumber, ewalletType } = req.body;
    if (!phoneNumber || !ewalletType) {
        return res.status(400).json({ success: false, message: 'Nomor HP dan tipe e-wallet diperlukan.' });
    }
    phoneNumber = phoneNumber.replace(/\D/g, '');
    const ewalletIdMap = {
        dana: 'dana',
        ovo: 'ovo',
        shopeepay: 'shopeepay',
        gopay: 'gopay',
        linkaja: 'linkaja',
        isaku: 'isaku'
    };
    const apiEwalletType = ewalletIdMap[ewalletType];
    if (!apiEwalletType) {
        return res.status(400).json({ success: false, message: 'Tipe e-wallet tidak valid.' });
    }
    const url = `https://checker.orderkuota.com/api/checkname/produk/260cc3cac9/01/388034/${apiEwalletType}`;
    const timestamp = Date.now().toString();
    const signature = crypto.randomBytes(64).toString('hex');
    const headers = {
        'signature': signature, 'timestamp': timestamp,
        'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'okhttp/4.12.0'
    };
    const body = new URLSearchParams({
        'app_reg_id': 'dIsu_SPMTMuYYqSKbLZtU-:APA91bEdO_vB0gvtBqTk0tce9JoJ3o7MyeKvGZeUx0ccZNvbTJPNhFTE2xbEZhFKV2K48EmqDNlXI1OBM0KxTv4md6j-lzuqgvMYfYoEi4FD94hbySHFsQ0',
        'phone_uuid': 'dIsu_SPMTMuYYqSKbLZtU-', 'phone_model': 'Infinix X6853',
        'phoneNumber': phoneNumber, 'request_time': timestamp,
        'phone_android_version': '15', 'app_version_code': '250718',
        'auth_username': 'OK388034', 'customerId': '',
        'id': apiEwalletType, 'auth_token': '388034:XZWugfYxmwEc3oMrbTejIn1AvU45SLQ8',
        'app_version_name': '25.07.18', 'ui_mode': 'light'
    });
    try {
        const { data } = await axios.post(url, body.toString(), { headers });
        if (data.status !== 'success' || !data.message) {
            throw new Error(data.message || `Nomor tidak terdaftar.`);
        }
        res.json({ success: true, name: data.message });
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Gagal memeriksa nama e-wallet.';
        res.status(400).json({ success: false, message: errorMessage });
    }
});
async function atlaListBank() {
    try {
        const response = await axios.post('https://atlantich2h.com/transfer/bank_list', qs.stringify({ api_key: global.atlantic.apikey }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        return response.data;
    } catch (error) {
        throw { status: error.response?.status || 500, message: error.response?.data?.message || error.message };
    }
}
async function atlaCekRekening(bankCode, number) {
    try {
        const response = await axios.post('https://atlantich2h.com/transfer/cek_rekening', qs.stringify({ api_key: global.atlantic.apikey, bank_code: bankCode, account_number: number }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        return response.data;
    } catch (error) {
        throw { status: error.response?.status || 500, message: error.response?.data?.message || error.message };
    }
}
router.get('/member/payment/list-bank', checkAuth, async (req, res) => {
    try {
        const apiResponse = await atlaListBank();
        if (apiResponse.status && apiResponse.data) {
            const ewalletCodesToExclude = ['dana', 'gopay', 'linkaja', 'ovo', 'shopeepay'];
            const filteredBanks = apiResponse.data.filter(bank => !ewalletCodesToExclude.includes(bank.bank_code));
            res.json({ success: true, result: filteredBanks });
        } else {
            res.status(400).json({ success: false, message: apiResponse.message || 'Gagal mengambil daftar bank.' });
        }
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: error.message });
    }
});
router.post('/member/payment/check-bank', checkAuth, async (req, res) => {
    const { number, code } = req.body;
    if (!number || !code) {
        return res.status(400).json({ success: false, message: `Parameter 'number' dan 'code' diperlukan.` });
    }
    try {
        const apiResponse = await atlaCekRekening(code, number);
        if (apiResponse.status && apiResponse.data && apiResponse.data.status === 'valid') {
            res.json({ success: true, result: { number: apiResponse.data.nomor_akun, name: apiResponse.data.nama_pemilik } });
        } else {
            res.status(400).json({ success: false, message: `Nomor rekening tidak valid atau tidak ditemukan.` });
        }
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: error.message });
    }
});
router.post('/member/payment/verify-qris', checkAuth, async (req, res) => {
    const { qrisUrl } = req.body;
    if (!qrisUrl) {
        return res.status(400).json({ success: false, message: 'URL QRIS diperlukan.' });
    }
    try {
        const image = await Jimp.read(qrisUrl);
        const qrCodeImage = new Uint8ClampedArray(image.bitmap.data.buffer);
        const qrCode = jsQR(qrCodeImage, image.bitmap.width, image.bitmap.height);
        if (!qrCode || !qrCode.data) {
            return res.status(400).json({ success: false, message: 'Tidak dapat menemukan QR code pada gambar dari URL.' });
        }
        if (qrCode.data.includes('010211')) { 
            return res.json({ success: true, message: 'QRIS Statis valid ditemukan!', qrisString: qrCode.data });
        } else if (qrCode.data.includes('010212')) { // Check for dynamic QRIS identifier
            return res.status(400).json({ success: false, message: 'QRIS Dinamis terdeteksi. Harap gunakan QRIS Statis.' });
        } else {
            return res.status(400).json({ success: false, message: 'Kode QR yang ditemukan bukan format QRIS yang valid.' });
        }
    } catch (error) {
        console.error("Error verifying QRIS URL:", error);
        return res.status(500).json({ success: false, message: 'Gagal memproses gambar dari URL. Pastikan URL valid dan dapat diakses.' });
    }
});

// ==> ENDPOINT BARU: Menampilkan Halaman Transaksi
router.get('/member/transaction', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        res.render('member/transaction', {
            user: user,
            webData: webData,
            page: 'transaction',
            csrfToken: req.csrfToken(),
        });
    } catch (error) {
        console.error(error);
        req.flash('error_messages', 'Gagal memuat halaman transaksi.');
        res.redirect('/member/payment');
    }
});
router.post('/member/transaction/update/:transactionId', checkAuth, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { status: newStatus } = req.body;
        if (!['sukses', 'gagal'].includes(newStatus)) {
            req.flash('error_messages', 'Status baru tidak valid.');
            return res.redirect('/member/transaction');
        }
        const user = await User.findById(req.user.id);
        const tx = user.riwayatTransaksi.find(t => t.transactionId === transactionId);
        if (!tx) {
            req.flash('error_messages', 'Transaksi tidak ditemukan.');
            return res.redirect('/member/transaction');
        }
        if (tx.status !== 'pending') {
            req.flash('error_messages', `Status transaksi yang sudah '${tx.status}' tidak dapat diubah.`);
            return res.redirect('/member/transaction');
        }
        const oldStatus = tx.status;
        tx.status = newStatus;
        if (oldStatus === 'pending') {
            user.transaksi.pending -= 1;
            user.transaksi.uang_pending -= tx.amount;

            if (newStatus === 'sukses') {
                user.transaksi.sukses += 1;
                user.transaksi.uang_sukses_total += tx.amount;
                user.transaksi.uang_sukses_hari_ini += tx.amount;
                user.transaksi.uang_sukses_bulan_ini += tx.amount;
                user.transaksi.omset_total += (tx.feeAmount + tx.uniqueNumber);
            } else if (newStatus === 'gagal') {
                user.transaksi.gagal += 1;
            }
        }
        await user.save();
        req.flash('success_messages', `Status transaksi ${transactionId} berhasil diubah menjadi ${newStatus}.`);
    } catch (error) {
        console.error("Manual update transaction error:", error);
        req.flash('error_messages', 'Terjadi kesalahan saat mengubah status transaksi.');
    }
    res.redirect('/member/transaction');
});

// Halaman Pengujian API
router.get('/member/testing', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        res.render('member/testing', {
            user: user,
            webData: webData,
            page: 'testing',
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});

router.get('/member/log-request', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        res.render('member/log-request', {
            user: user,
            webData: webData,
            page: 'log-request',
            csrfToken: req.csrfToken(),
        });
    } catch (error) {
        console.error("Gagal memuat halaman Log Request:", error);
        req.flash('error_messages', 'Terjadi kesalahan saat memuat halaman log.');
        res.redirect('/member/payment');
    }
});

// DITAMBAHKAN: Rute-rute untuk halaman Integrasi
router.get('/member/integration', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        res.render('member/integration', {
            user: user,
            webData: webData,
            page: 'integration',
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error("Integration page error:", error);
        req.flash('error_messages', 'Gagal memuat halaman integrasi.');
        res.redirect('/member/payment');
    }
});
router.post('/member/integration/telegram', checkAuth, async (req, res) => {
    const { token_bot, chat_id } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const testMessage = `🎉 *Koneksi Berhasil!* 🎉\n\nBot Telegram Anda telah berhasil terhubung dengan sistem MyGateway. Anda akan menerima notifikasi transaksi melalui chat ini.`;
        const sendTest = await mailer.sendTelegramMessage(token_bot, chat_id, testMessage);
        if (sendTest === 'error') {
            req.flash('error_messages', 'Gagal terhubung ke bot. Pastikan Token Bot dan Chat ID benar, dan bot sudah di-start.');
            return res.redirect('/member/integration');
        }
        user.telegram.token_bot = token_bot;
        user.telegram.chat_id = chat_id;
        await user.save();
        req.flash('success_messages', 'Pengaturan Telegram berhasil disimpan dan koneksi berhasil diuji.');
        res.redirect('/member/integration');
    } catch (error) {
        console.error("Telegram settings error:", error);
        req.flash('error_messages', 'Terjadi kesalahan saat menyimpan pengaturan.');
        res.redirect('/member/integration');
    }
});

// DITAMBAHKAN: Rute untuk halaman Tutorial
router.get('/member/tutorial', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        const configuredMethods = {
            hasQris: user.paymentMethods.some(m => m.category === 'QRIS' && m.isEnabled),
            hasEwallet: user.paymentMethods.some(m => m.category === 'Ewallet' && m.isEnabled),
            hasBank: user.paymentMethods.some(m => m.category === 'Bank' && m.isEnabled)
        };
        res.render('member/tutorial', {
            user: user,
            webData: webData,
            page: 'tutorial',
            csrfToken: req.csrfToken(),
            configuredMethods: configuredMethods 
        });
    } catch (error) {
        console.error("Tutorial page error:", error);
        req.flash('error_messages', 'Gagal memuat halaman tutorial.');
        res.redirect('/member/payment');
    }
});

// DITAMBAHKAN: Rute untuk halaman Dokumentasi API
router.get('/member/documentation', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.render('member/documentation', {
            user: user,
            webData: webData,
            page: 'documentation',
            baseUrl: baseUrl,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error("Documentation page error:", error);
        req.flash('error_messages', 'Gagal memuat halaman dokumentasi.');
        res.redirect('/member/payment');
    }
});

// DITAMBAHKAN: Rute untuk menampilkan halaman profil
router.get('/member/profile', checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const webData = await Web.getSingleton();
        const baseUrl = `${req.protocol}://${req.get('host')}`; // Diperlukan untuk URL Toko
        res.render('member/profile', {
            user: user,
            webData: webData,
            page: 'profile',
            baseUrl: baseUrl,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error("Profile page error:", error);
        req.flash('error_messages', 'Gagal memuat halaman profil.');
        res.redirect('/member/payment');
    }
});
router.post('/member/profile/update', checkAuth, async (req, res) => {
    try {
        const { action } = req.body;
        const user = await User.findById(req.user.id);

        if (action === 'update_info') {
            const { name, no_telp } = req.body;
            user.name = name;
            user.no_telp = no_telp;
            await user.save();
            req.flash('success_messages', 'Informasi pribadi berhasil diperbarui.');
        } 
        else if (action === 'update_store_info') {
            const { storeName, storeLogoUrl } = req.body;
            user.store.name = storeName;
            user.store.logoUrl = storeLogoUrl;
            await user.save();
            req.flash('success_messages', 'Informasi toko berhasil diperbarui.');
        } 
        else if (action === 'regenerate_api_key') {
            user.apiKey = crypto.randomBytes(24).toString('hex');
            await user.save();
            req.flash('success_messages', 'API Key baru berhasil dibuat.');
        } 
        else {
            req.flash('error_messages', 'Aksi tidak valid.');
        }
    } catch (error) {
        console.error("Profile update error:", error);
        req.flash('error_messages', 'Terjadi kesalahan saat memperbarui profil.');
    }
    res.redirect('/member/profile');
});

// Rute Logout
router.get("/auth/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success_messages', 'Anda berhasil logout.');
        res.redirect("/auth/login");
    });
});

router.use(authRoutes);

module.exports = router;