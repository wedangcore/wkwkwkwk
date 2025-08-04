require("./settings");
const express = require("express");
const app = express();
const favicon = require("serve-favicon");
const path = require("path");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const mongoose = require("mongoose");
const expressSession = require("express-session");
const MemoryStore = require("memorystore")(expressSession);
const passport = require("passport");
const flash = require("connect-flash");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const secure = require("ssl-express-www");
const cors = require("cors");
const Web = require("./model/web");

// Impor Rute
const member = require("./routes/member");
const auth = require('./routes/auth');
const paymentUrlRoutes = require('./routes/help/payment-url').router;
const qrisRoutes = require('./routes/payment-qris');
const ewalletRoutes = require('./routes/payment-ewallet');
const bankRoutes = require('./routes/payment-bank');
const listRoutes =require('./routes/help/payment-list');
const macrodroid =require('./routes/help/macrodroid');
const storeRoutes = require('./routes/store');
const adminRoutes = require('./routes/admin');
const logApiRequest = require('./routes/help/log-api');

app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.set("strictQuery", false);
mongoose.connect(global.keymongodb, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Terhubung ke MongoDB!");
        await Web.getSingleton();
        console.log("Data Website berhasil dibuat / dimuat.");
    }).catch(err => console.error("Gagal terhubung ke MongoDB", err));
app.use(cookieParser("random"));
app.use(expressSession({ secret: "random", resave: true, saveUninitialized: true, maxAge: 24 * 60 * 60 * 1000, store: new MemoryStore() }));
app.use(passport.initialize());
app.use(express.static("public"));
app.use(passport.session());
app.set("trust proxy", true);
app.set("json spaces", 2);
app.use(cors());
app.use(secure);
app.use(flash());

// =======================================================================
// === PERBAIKAN UTAMA ADA DI SINI ===
// =======================================================================

// A. BUAT GRUP RUTE API (TANPA CSRF)
// Rute-rute ini hanya bergantung pada API Key untuk otentikasi.
const apiRouter = express.Router();
apiRouter.use(logApiRequest); // Terapkan logging
apiRouter.use(qrisRoutes);
apiRouter.use(ewalletRoutes);
apiRouter.use(bankRoutes);
apiRouter.use(listRoutes);
app.use("/", apiRouter); // Pasang grup API ke aplikasi

// B. PASANG CSRF PROTECTION SETELAH RUTE API
const csrfProtection = csrf();
app.use(csrfProtection);

// C. BUAT GRUP RUTE WEB (YANG MEMERLUKAN CSRF)
// Semua rute di bawah ini sekarang dilindungi oleh CSRF.
const webRouter = express.Router();
webRouter.use((req, res, next) => {
    res.locals.success_messages = req.flash("success_messages");
    res.locals.error_messages = req.flash("error_messages");
    res.locals.error = req.flash("error");
    res.locals.csrfToken = req.csrfToken();
    next();
});

webRouter.use("/", member);
webRouter.use("/", auth);
webRouter.use("/", paymentUrlRoutes);
webRouter.use("/", storeRoutes);
webRouter.use("/", adminRoutes);
webRouter.use("/", macrodroid);
app.use("/", webRouter);

// =======================================================================

// Handle 404
app.use(function(req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN') {
        // Handle error CSRF secara spesifik jika diperlukan
        console.error("CSRF Token Error:", err.message);
        res.status(403).send('Sesi tidak valid atau telah kedaluwarsa. Silakan muat ulang halaman.');
        return;
    }
    if (err.status !== 404) {
        console.error(err.stack);
    }
    res.status(err.status || 500);
    res.render("404");
});

module.exports = app;