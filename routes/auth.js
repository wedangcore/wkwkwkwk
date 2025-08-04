require('../settings');
const passport = require('passport');
require('../controller/passportLocal')(passport);
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const resetToken = require('../model/resetTokens');
const User = require('../model/user');
const Web = require('../model/web');
const mailer = require('../controller/sendMail');
const bcryptjs = require('bcryptjs');
const passwordValidator = require('password-validator');
const containsEmoji = require('contains-emoji');
const isGmail = require('is-gmail');
const Recaptcha = require('express-recaptcha').RecaptchaV2;
const recaptcha = new Recaptcha(recaptcha_key_1, recaptcha_key_2);

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    } else {
        req.flash('error_messages', "Login!");
        res.redirect('/auth/login');
    }
}

function captchaForgotPassword(req, res, next) {
    if (req.recaptcha.error) {
        req.flash('error_messages', 'reCaptcha Tidak Valid!');
        res.redirect('/auth/forgot-password');
    } else {
        return next();
    }
}

function captchaResetPassword(req, res, next) {
    const { token } = req.body;
    if (req.recaptcha.error) {
        req.flash('error_messages', 'reCaptcha Tidak Valid!');
        res.redirect(`/auth/reset-password?token=${token}`);
    } else {
        return next();
    }
}

function captchaRegister(req, res, next) {
    if (req.recaptcha.error) {
        req.flash('error_messages', 'reCaptcha Tidak Valid!');
        res.redirect('/auth/signup');
    } else {
        return next();
    }
}

function captchaLogin(req, res, next) {
    if (req.recaptcha.error) {
        req.flash('error_messages', 'reCaptcha Tidak Valid!');
        res.redirect('/auth/login');
    } else {
        return next();
    }
}

router.get('/auth/login', recaptcha.middleware.render, (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/member/payment");
    } else {
        res.render("auth/login", {
            csrfToken: req.csrfToken(),
            recaptcha: res.recaptcha
        });
    }
});

router.post('/auth/login', recaptcha.middleware.verify, captchaLogin, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error_messages', info.message);
            return res.redirect('/auth/login');
        }
        if (!user.isVerified) {
            req.flash('error_messages', 'Akun Anda belum diverifikasi. Silakan cek email Anda untuk kode verifikasi.');
            req.session.emailForVerification = user.email;
            return res.redirect('/auth/verifikasi');
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/member/payment');
        });
    })(req, res, next);
});

router.get('/auth/signup', recaptcha.middleware.render, (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/member/payment");
    } else {
        res.render("auth/signup", {
            csrfToken: req.csrfToken(),
            recaptcha: res.recaptcha
        });
    }
});

router.post('/auth/signup', recaptcha.middleware.verify, captchaRegister, async (req, res) => {
    const { name, no_telp, password, confirmpassword } = req.body;
    const email = req.body.email ? req.body.email.trim() : '';
    const username = req.body.username ? req.body.username.trim() : '';
    var createpw = new passwordValidator();
    createpw.is().min(8).is().max(30).has().uppercase().has().lowercase().has().digits().has().not().spaces().is().not().oneOf(['Passw0rd', 'Password123']);
    var checkpw = createpw.validate(password);
    var checkemail = await isGmail(email);
    if (!name || !email || !username || !no_telp || !password || !confirmpassword) { req.flash('error_messages','All Fields Required!'); return res.redirect('/auth/signup'); }
    if (password != confirmpassword) { req.flash('error_messages',"Password Don't Match!"); return res.redirect('/auth/signup'); }
    if (!checkpw) { req.flash('error_messages',"Password Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters,no emoji and no Space Limit 30 text"); return res.redirect('/auth/signup'); }
    if (containsEmoji(password)) { req.flash('error_messages',"Password Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters,no emoji and no Space Limit 30 text"); return res.redirect('/auth/signup'); }
    if (username.length < 4) { req.flash('error_messages',"Username harus minimal 4 karakter!"); return res.redirect('/auth/signup'); }
    if (username.length > 20) { req.flash('error_messages',"Username tidak boleh lebih 20 karakter!"); return res.redirect('/auth/signup'); }
    if (containsEmoji(username)) { req.flash('error_messages',"Username Tidak Diperbolehkan Mwnggunakan Emoji!"); return res.redirect('/auth/signup'); }
    if (!checkemail){ req.flash('error_messages',"Masukkan Gmail yg Valid!"); return res.redirect('/auth/signup'); }
    try {
        const existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
        if (existingUser) {
            req.flash('error_messages', "User dengan email atau username tersebut sudah ada.");
            return res.redirect('/auth/signup');
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit
        const salt = await bcryptjs.genSalt(12);
        const hash = await bcryptjs.hash(password, salt);
        const newUser = new User({
            name, email, username, no_telp,
            password: hash,
            verificationCode,
            verificationExpires
        });
        await newUser.save();
        await mailer.sendVerificationCode(newUser.email, verificationCode);
        const webData = await Web.getSingleton();
        webData.total_user += 1;
        await webData.save();

        try {
            const admin = await User.findOne({ isAdmin: true });
            if (admin && admin.telegram.token_bot && admin.telegram.chat_id) {
                const notifMessage = 
`👤 *Pengguna Baru Mendaftar*

*Nama:* ${newUser.name}
*Username:* \`${newUser.username}\`
*Email:* ${newUser.email}
*No. Telp:* ${newUser.no_telp}
*Tanggal:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
                
                await mailer.sendTelegramMessage(
                    admin.telegram.token_bot, 
                    admin.telegram.chat_id, 
                    notifMessage
                );
            }
        } catch (notifError) {
            console.error("Gagal mengirim notifikasi pendaftaran ke admin:", notifError);
        }
        req.session.emailForVerification = newUser.email;
        req.flash('success_messages', `Pendaftaran berhasil! Kode verifikasi telah dikirim ke ${newUser.email}.`);
        res.redirect('/auth/verifikasi');
    } catch (error) {
        console.error(error);
        req.flash('error_messages', 'Terjadi kesalahan pada server, silakan coba lagi.');
        res.redirect('/auth/signup');
    }
});

router.get('/auth/verifikasi', (req, res) => {
    const email = req.session.emailForVerification;
    if (!email) {
        return res.redirect('/auth/signup');
    }
    res.render('auth/verifikasi', { 
        email: email,
        csrfToken: req.csrfToken() 
    });
});

router.post('/auth/verifikasi', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ 
            email: email, 
            verificationCode: code,
            verificationExpires: { $gt: Date.now() }
        });
        if (!user) {
            req.flash('error_messages', 'Kode verifikasi tidak valid atau telah kedaluwarsa.');
            return res.redirect('/auth/verifikasi');
        }
        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationExpires = undefined;
        await user.save();
        req.session.emailForVerification = null;
        req.flash('success_messages', 'Akun berhasil diverifikasi! Silakan login.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        req.flash('error_messages', 'Terjadi kesalahan pada server.');
        res.redirect('/auth/verifikasi');
    }
});

router.get('/auth/verifikasi/resend', async (req, res) => {
    try {
        const email = req.session.emailForVerification;
        if (!email) {
            return res.redirect('/auth/signup');
        }
        // Cooldown 1 menit untuk mencegah spam email
        const now = Date.now();
        const lastSent = req.session.lastResendTime || 0;
        if (now - lastSent < 60000) { // 60000 milidetik = 1 menit
            req.flash('error_messages', 'Silakan tunggu 1 menit sebelum mengirim ulang kode.');
            return res.redirect('/auth/verifikasi');
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            req.flash('error_messages', 'User tidak ditemukan.');
            return res.redirect('/auth/signup');
        }
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit
        user.verificationCode = newCode;
        user.verificationExpires = newExpires;
        await user.save();
        await mailer.sendVerificationCode(user.email, newCode);
        req.session.lastResendTime = now;
        req.flash('success_messages', `Kode verifikasi baru telah dikirim ke ${user.email}.`);
        res.redirect('/auth/verifikasi');
    } catch (error) {
        console.error("Resend verification error:", error);
        req.flash('error_messages', 'Gagal mengirim ulang kode verifikasi.');
        res.redirect('/auth/verifikasi');
    }
});

router.get('/auth/forgot-password', recaptcha.middleware.render, async (req, res) => {
    res.render('auth/forgot-password', {
        csrfToken: req.csrfToken(),
        recaptcha: res.recaptcha
    });
});

router.post('/auth/forgot-password', recaptcha.middleware.verify, captchaForgotPassword, async (req, res) => {
    const { email } = req.body;
    if (!email) {
        req.flash('error_messages', 'All Fields Required!');
        res.redirect('/auth/forgot-password');
    }
    var userData = await User.findOne({ email: email });
    var Cooldown = await resetToken.findOne({ email: email });
    if (userData) {
        if (Cooldown) {
            req.flash('error_messages', 'Please Dont Spam Wait After 30 menit after new submit.');
            res.redirect('/auth/forgot-password')
        } else {
            var token = crypto.randomBytes(32).toString('hex');
            var mail = await mailer.sendResetEmail(email, token)
            if (mail == 'error') {
                req.flash('error_messages', 'Error Please Try Again Tomorrow');
                res.redirect('/auth/forgot-password');
            } else {
                await resetToken({ token: token, email: email }).save();
                req.flash('success_messages', 'Check your email for more info, wait 30 menit after new submit.');
                res.redirect('/auth/forgot-password');
            }
        }
    } else {
        req.flash('error_messages', 'No user Exists with this email');
        res.redirect('/auth/forgot-password');
    }
});

router.get('/auth/reset-password', recaptcha.middleware.render, async (req, res) => {
    const token = req.query.token;
    if (token) {
        var check = await resetToken.findOne({ token: token });
        if (check) {
            res.render('auth/forgot-password', {
                csrfToken: req.csrfToken(),
                recaptcha: res.recaptcha,
                reset: true,
                email: check.email,
                token: token
            });
        } else {
            req.flash('error_messages', 'Token Tampered or Expired.');
            res.redirect('/auth/forgot-password');
        }
    } else {
        res.redirect('/auth/login');
    }
});

router.post('/auth/reset-password', recaptcha.middleware.verify, captchaResetPassword, async (req, res) => {
    const { password, confirmpassword, email, token } = req.body;
    var resetpw = new passwordValidator();
    resetpw
        .is().min(8)
        .is().max(30)
        .has().uppercase()
        .has().lowercase()
        .has().digits()
        .has().not().spaces()
        .is().not().oneOf(['Passw0rd', 'Password123']);
    var checkpw = resetpw.validate(password)
    if (!password || !confirmpassword || confirmpassword != password) {
        req.flash('error_messages', "Passwords Don't Match !");
        res.redirect(`/auth/reset-password?token=${token}`);
    } else if (!checkpw) {
        req.flash('error_messages', "Password Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters,no emoji and no Space Limit 30 text");
        res.redirect(`/auth/reset-password?token=${token}`);
    } else {
        var salt = await bcryptjs.genSalt(12);
        if (salt) {
            var hash = await bcryptjs.hash(password, salt);
            await User.findOneAndUpdate({ email: email }, { $set: { password: hash } });
            await resetToken.findOneAndDelete({ token: token });
            req.flash('success_messages', 'Password Has Change')
            res.redirect('/auth/login');
        } else {
            req.flash('error_messages', "Unexpected Error Try Again");
            res.redirect(`/auth/reset-password?token=${token}`);
        }
    }
});


module.exports = router;