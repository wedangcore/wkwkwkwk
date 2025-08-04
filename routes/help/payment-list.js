const express = require('express');
const router = express.Router();
const User = require('../../model/user');
const logApiRequest = require('./log-api');

router.post('/payment/list', logApiRequest, async (req, res) => {
    const { apikey } = req.body;
    if (!apikey) {
        return res.status(401).json({ success: false, message: 'Otentikasi gagal. Parameter "apikey" dibutuhkan.' });
    }

    try {
        const user = await User.findOne({ apiKey: apikey });
        if (!user) {
            return res.status(401).json({ success: false, message: 'API Key tidak valid.' });
        }

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

        res.json({
            success: true,
            message: "Berhasil menampilkan list ID Payment.",
            data: groupedMethods
        });

    } catch (error) {
        console.error("Error fetching payment list:", error);
        res.status(500).json({ success: false, message: 'Kesalahan internal server.' });
    }
});

module.exports = router;