const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send('Akses ditolak. Silakan login terlebih dahulu.');
}

router.post('/member/tutorial/macrodroid/download', checkAuth, (req, res) => {
    try {
        const user = req.user;
        const apikey = user.apiKey;
        const selectedCats = req.body.cats || [];
        const categorySelections = Array.isArray(selectedCats) ? selectedCats : [selectedCats];

        if (categorySelections.length === 0) {
            req.flash('error_messages', 'Anda harus memilih setidaknya satu kategori pembayaran.');
            return res.redirect('/member/tutorial');
        }

        // --- LOGIKA BARU UNTUK URL DINAMIS ---
        let endpointPath = '/payment/ewallet'; // Default URL
        if (categorySelections.includes('qris')) {
            endpointPath = '/payment/qris';
        } else if (categorySelections.includes('ewallet')) {
            endpointPath = '/payment/ewallet';
        } else if (categorySelections.includes('bank')) {
            endpointPath = '/payment/bank';
        }
        const endpointUrl = `https://${req.get('host')}${endpointPath}`;

        // Baca Template
        const templatePath = path.join(__dirname, '..', '..', 'model', 'macrodroid-template.macro');
        if (!fs.existsSync(templatePath)) {
            throw new Error("File template macro tidak ditemukan.");
        }
        let macroContent = fs.readFileSync(templatePath, 'utf-8');

        // Ganti placeholder. Package list dan app name list dikosongkan.
        macroContent = macroContent.replace(/"urlToOpen":"PLACEHOLDER_URL"/g, `"urlToOpen":"${endpointUrl}"`);
        macroContent = macroContent.replace(/PLACEHOLDER_APIKEY/g, apikey);
        macroContent = macroContent.replace(/"m_packageNameList":\["PLACEHOLDER_PACKAGES"\]/g, `"m_packageNameList":[]`);
        macroContent = macroContent.replace(/"m_applicationNameList":\["PLACEHOLDER_APPS"\]/g, `"m_applicationNameList":[]`);

        // Kirim File
        res.setHeader('Content-Disposition', 'attachment; filename="WBK-PayGateway.macro"');
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(macroContent);

    } catch (error) {
        console.error("Gagal membuat file macro:", error);
        req.flash('error_messages', 'Gagal membuat file konfigurasi: ' + error.message);
        res.redirect('/member/tutorial');
    }
});

module.exports = router;