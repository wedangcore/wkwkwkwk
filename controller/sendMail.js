require('../settings')

const axios = require('axios');
const nodemailer = require("nodemailer");

const User = require('../model/user');

const smtpTransport = nodemailer.createTransport({
    host: hostemail,
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: sendemail,
        pass: pwsendemail,
    },
});

module.exports.sendResetEmail = async (email, token) => {
    return new Promise(async (resolve, rejecet) => {

        var url = `https://${domain}/auth/reset-password?token=` + token;

        await smtpTransport.sendMail({
            from: fromsendemail,
            to: email,
            subject: "RESET KATA SANDI",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; text-align: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #0d6efd; text-decoration: none; border-radius: 5px; }
        p { color: #555555; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Kata Sandi Anda</h2>
        <p>Anda menerima email ini karena ada permintaan untuk mereset kata sandi akun Anda. Klik tombol di bawah untuk melanjutkan.</p>
        <a href="${url}" class="button">Reset Kata Sandi</a>
        <p style="margin-top: 30px; font-size: 14px;">Jika Anda tidak meminta reset kata sandi, Anda dapat mengabaikan email ini dengan aman.</p>
    </div>
</body>
</html>
`
        }, (error, info) => {
            if (error) {
                resolve('error')
                console.log(`[!] Warning SMTP error ,Limit Habis`);
            } else {
                resolve()
            }
        });

    })

}

module.exports.sendVerificationCode = async (email, code) => {
    return new Promise(async (resolve, reject) => {
        await smtpTransport.sendMail({
            from: fromsendemail,
            to: email,
            subject: "Kode Verifikasi Akun",
            html: `
            <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                <h2>Verifikasi Akun Anda</h2>
                <p>Terima kasih telah mendaftar. Gunakan kode di bawah ini untuk mengaktifkan akun Anda:</p>
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px; padding: 10px; background-color: #f2f2f2; border-radius: 5px; display: inline-block;">
                    ${code}
                </div>
                <p>Kode ini akan kedaluwarsa dalam 10 menit.</p>
                <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
            </div>
            `
        }, (error, info) => {
            if (error) {
                console.log(`[!] Peringatan: Error SMTP, mungkin limit habis.`);
                resolve('error');
            } else {
                resolve();
            }
        });
    });
}

module.exports.sendContactFormEmail = async (senderName, senderEmail, subject, message) => {
    return new Promise(async (resolve, reject) => {
        try {
            const admin = await User.findOne({ isAdmin: true });
            if (!admin) {
                console.log("[!] Peringatan: Tidak ada user admin yang ditemukan untuk menerima email kontak.");
                return resolve('error');
            }
            await smtpTransport.sendMail({
                from: fromsendemail,
                to: admin.email,
                replyTo: senderEmail,
                subject: `Pesan Kontak Baru: ${subject}`,
                html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
                    <h2 style="color: #0d6efd;">Pesan Baru dari Formulir Kontak</h2>
                    <p>Anda menerima pesan baru melalui formulir kontak di website Anda.</p>
                    <hr>
                    <p><strong>Dari:</strong> ${senderName} (${senderEmail})</p>
                    <p><strong>Subjek:</strong> ${subject}</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
                        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>
                    <hr>
                    <p style="font-size: 12px; color: #777;">Anda dapat membalas email ini untuk merespons pengirim secara langsung.</p>
                </div>
                `
            }, (error, info) => {
                if (error) {
                    console.log(`[!] Peringatan: Error SMTP saat mengirim email kontak.`);
                    resolve('error');
                } else {
                    resolve();
                }
            });
        } catch (dbError) {
            console.error("Gagal mencari user admin untuk email kontak:", dbError);
            resolve('error');
        }
    });
};

module.exports.sendTelegramMessage = async (token, chatId, message) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        return 'success';
    } catch (error) {
        console.error("Telegram send error:", error.response ? error.response.data : error.message);
        return 'error';
    }
};