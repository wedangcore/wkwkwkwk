
require('../settings');

const axios = require('axios')

const rateLimit = require('express-rate-limit');
const User = require('../model/user');
const dataweb = require('../model/DataWeb');

//―――――――――――――――――――――――――――――――――――――――――― ┏ Funtion App ┓ ―――――――――――――――――――――――――――――――――――――――――― \\

exports.fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}


exports.getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (err) {
		return err
	}
}


exports.runtime = function(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.jsonformat = (string) => {
    return JSON.stringify(string, null, 2)
}

exports.apiLimiter = rateLimit({
    windowMs: 30 * 1000, // Jendela waktu 30 detik
    max: 10, // Maksimal 10 permintaan per jendela waktu
    keyGenerator: (req, res) => {
        return req.query.apikey; // Menggunakan API key sebagai kunci unik
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            status: false,
            creator: `${creator}`,
            message: `Terlalu banyak permintaan, silakan coba lagi setelah 30 detik.`
        });
    },
    standardHeaders: true, // Mengirim header RateLimit-*
    legacyHeaders: false, // Menonaktifkan header X-RateLimit-*
});

exports.cekKey = async (req, res, next) => {
    const apikey = req.query.apikey;
    if (!apikey) {
        return res.status(401).json({
            status: false,
            creator: `${creator}`,
            message: "Masukkan parameter Apikey!"
        });
    }
    try {
        const db = await User.findOne({ apikey: apikey });
        if (!db) {
            return res.status(404).json({
                status: false,
                creator: `${creator}`,
                message: "API Key tidak ditemukan atau tidak valid."
            });
        }
        if (!db.isVerified) {
            return res.status(403).json({
                status: false,
                creator: `${creator}`,
                message: "Harap verifikasi email Anda terlebih dahulu untuk menggunakan API Key."
            });
        }
        if (db.limitApikey === 0 && !db.isPremium?.unlimited) {
            return res.status(429).json({
                status: false,
                creator: `${creator}`,
                message: "Limit penggunaan API Key Anda sudah habis."
            });
        }
        next(); // Lanjut ke rute berikutnya jika semua pemeriksaan lolos
    } catch (error) {
        console.error('Error saat memeriksa API Key:', error);
        res.status(500).json({
            status: false,
            creator: `${creator}`,
            message: "Terjadi kesalahan internal pada server."
        });
    }
};

exports.limitapikey = async (apikey) => {
    try {
        await dataweb.updateOne({}, {
            $inc: {
                RequestToday: 1,
                RequestMonth: 1
            }
        });
        const user = await User.findOne({ apikey: apikey });
        if (user && !user.isPremium?.unlimited) {
            await User.updateOne({
                apikey: apikey
            }, {
                $inc: {
                    limitApikey: -1
                }
            });
        }
    } catch (error) {
        console.error('Error saat mengurangi limit API Key:', error);
    }
};
