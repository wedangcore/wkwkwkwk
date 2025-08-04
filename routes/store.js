const express = require('express');
const router = express.Router();
const User = require('../model/user');
const axios = require('axios');
const { encrypt } = require('./help/payment-url');

// ENDPOINT 1: Menampilkan halaman toko publik (Tidak Berubah)
router.get('/store/:username', async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(404).render('payment/payment-error', { message: 'Toko tidak ditemukan.' });
        }

        const activeMethods = user.paymentMethods.filter(m => m.isEnabled);

        const groupedMethods = activeMethods.reduce((acc, method) => {
            const category = method.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(method);
            return acc;
        }, {});

        res.render('store/store', {
            merchant: user,
            groupedMethods: groupedMethods,
            pageTitle: `Toko ${user.store.name || user.username}`,
            csrfToken: req.csrfToken()
        });

    } catch (error) {
        console.error("Error loading store page:", error);
        res.status(500).render('payment/payment-error', { message: 'Terjadi kesalahan pada server.' });
    }
});


// =======================================================================
// === PERUBAHAN LOGIKA UTAMA ADA DI SINI ===
// =======================================================================
router.post('/store/:username/pay', async (req, res) => {
    const { username } = req.params;
    try {
        const { amount, paymentMethodId } = req.body;
        
        const merchant = await User.findOne({ username: username });
        if (!merchant) {
            req.flash('error_messages', 'Toko tidak valid.');
            return res.redirect(`/store/${username}`);
        }

        const method = merchant.paymentMethods.find(m => m.id === paymentMethodId && m.isEnabled);
        if (!method) {
            req.flash('error_messages', 'Metode pembayaran tidak valid atau tidak aktif.');
            return res.redirect(`/store/${username}`);
        }
        
        // Tentukan endpoint API internal berdasarkan kategori metode
        const categoryEndpoint = method.category.toLowerCase(); // 'qris', 'ewallet', atau 'bank'
        const apiUrl = `${req.protocol}://${req.get('host')}/payment/${categoryEndpoint}`;
        
        // Siapkan body untuk dikirim ke API internal
        const apiBody = {
            action: "create",
            apikey: merchant.apiKey,
            amount: amount,
            paymentMethod: paymentMethodId
        };
        
        // Panggil API internal
        const apiResponse = await axios.post(apiUrl, apiBody);

        // Jika API internal merespons dengan sukses dan memberikan paymentUrl
        if (apiResponse.data && apiResponse.data.success && apiResponse.data.data.paymentUrl) {
            // Arahkan pelanggan ke halaman pembayaran
            return res.redirect(apiResponse.data.data.paymentUrl);
        } else {
            // Jika API internal gagal, tampilkan pesan error dari API tersebut
            req.flash('error_messages', apiResponse.data.message || 'Gagal membuat transaksi.');
            return res.redirect(`/store/${username}`);
        }

    } catch (error) {
        console.error("Error processing payment from store:", error);
        // Tangani jika error berasal dari axios (API internal)
        if (error.response && error.response.data && error.response.data.message) {
             req.flash('error_messages', error.response.data.message);
        } else {
            req.flash('error_messages', 'Terjadi kesalahan internal, silakan coba lagi.');
        }
        res.redirect(`/store/${username}`);
    }
});

module.exports = router;