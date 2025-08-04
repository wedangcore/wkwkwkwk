const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Web = require('../model/web');
const passport = require('passport');

// Middleware untuk memastikan hanya admin yang bisa mengakses
function checkAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    }
    req.flash('error_messages', "Anda tidak memiliki izin untuk mengakses halaman ini.");
    res.redirect('/auth/login');
}

// ENDPOINT 1: Halaman Login Admin
router.get('/admin/login', (req, res) => {
    // Jika sudah login sebagai admin, redirect ke dashboard
    if (req.isAuthenticated() && req.user.isAdmin) {
        return res.redirect('/admin/member');
    }
    res.render('admin/login', {
        pageTitle: 'Admin Login',
        csrfToken: req.csrfToken()
    });
});

router.post('/admin/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error_messages', info.message);
            return res.redirect('/admin/login');
        }
        // Kunci Pembeda: Cek apakah user adalah admin
        if (!user.isAdmin) {
            req.flash('error_messages', 'Akses ditolak. Akun bukan administrator.');
            return res.redirect('/admin/login');
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/admin/member');
        });
    })(req, res, next);
});

// ENDPOINT 2: Halaman Manajemen Member
router.get('/admin/member', checkAdmin, async (req, res) => {
    try {
        const members = await User.find({}).sort({ createdAt: -1 });
        const webData = await Web.getSingleton();
        res.render('admin/member', {
            user: req.user,
            webData: webData,
            members: members,
            page: 'admin-member',
            pageTitle: 'Manajemen Member'
        });
    } catch (error) {
        console.error("Admin member page error:", error);
        res.redirect('/member/payment');
    }
});

// ENDPOINT 3: Halaman Transaksi Realtime
router.get('/admin/transaction', checkAdmin, async (req, res) => {
    try {
        // Ambil semua transaksi dari semua user, lalu gabungkan dan urutkan
        const allUsers = await User.find({ 'riwayatTransaksi.0': { $exists: true } }).select('username riwayatTransaksi');
        let allTransactions = [];
        allUsers.forEach(user => {
            user.riwayatTransaksi.forEach(tx => {
                // Tambahkan username ke setiap objek transaksi untuk identifikasi
                allTransactions.push({ ...tx.toObject(), owner: user.username });
            });
        });

        // Urutkan semua transaksi berdasarkan tanggal pembuatan terbaru
        allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const webData = await Web.getSingleton();
        res.render('admin/transaction', {
            user: req.user,
            webData: webData,
            transactions: allTransactions,
            page: 'admin-transaction',
            pageTitle: 'Transaksi Realtime'
        });
    } catch (error) {
        console.error("Admin transaction page error:", error);
        res.redirect('/admin/member');
    }
});

// ENDPOINT 4: Halaman Pengaturan Website
router.get('/admin/setting', checkAdmin, async (req, res) => {
    try {
        const webData = await Web.getSingleton();
        res.render('admin/setting', {
            user: req.user,
            webData: webData,
            page: 'admin-setting',
            pageTitle: 'Pengaturan Website',
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error("Admin setting page error:", error);
        res.redirect('/admin/member');
    }
});

router.post('/admin/setting/update', checkAdmin, async (req, res) => {
    try {
        const { name, iconUrl } = req.body;
        const webData = await Web.getSingleton();
        webData.name = name;
        webData.iconUrl = iconUrl;
        await webData.save();

        req.flash('success_messages', 'Pengaturan website berhasil diperbarui.');
        res.redirect('/admin/setting');
    } catch (error) {
        console.error("Admin setting update error:", error);
        req.flash('error_messages', 'Gagal memperbarui pengaturan.');
        res.redirect('/admin/setting');
    }
});

module.exports = router;