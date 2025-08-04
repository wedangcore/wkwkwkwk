const User = require('../../model/user');
const onFinished = require('on-finished'); // DITAMBAHKAN

const logApiRequest = async (req, res, next) => {
    console.log(`[LOG MIDDLEWARE] Berjalan untuk endpoint: ${req.originalUrl}`);
    // Menangkap response body (logika ini tetap sama)
    const originalJson = res.json;
    let responseBody = null;

    res.json = function(body) {
        responseBody = body;
        return originalJson.call(this, body);
    };

    // DIGANTI: Menggunakan 'onFinished' yang lebih andal daripada 'res.on('finish')'
    onFinished(res, async () => {
        try {
            const { apikey, ...requestBody } = req.body;
            if (!apikey) {
                return; // Keluar jika tidak ada apikey di body
            }

            const user = await User.findOne({ apiKey: apikey });
            if (!user) {
                return; // Keluar jika apikey tidak valid
            }

            const logEntry = {
                timestamp: new Date(),
                method: req.method,
                endpoint: req.originalUrl,
                ipAddress: req.ip || req.connection.remoteAddress,
                requestBody: JSON.stringify(requestBody, null, 2),
                responseStatus: res.statusCode,
                responseBody: JSON.stringify(responseBody, null, 2)
            };

            user.apiRequestLogs.push(logEntry);

            // Batasi jumlah log agar dokumen tidak terlalu besar (misal: simpan 100 log terakhir)
            if (user.apiRequestLogs.length > 100) {
                user.apiRequestLogs.shift();
            }

            await user.save();
            console.log(`Log API untuk user ${user.username} berhasil disimpan.`); // Tambahan log untuk debugging

        } catch (err) {
            console.error('Gagal menyimpan Log API:', err);
        }
    });

    next();
};

module.exports = logApiRequest;