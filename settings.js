require('dotenv').config()

creator = 'WBK' // Nama 
port = 8080 //port host
LimitApikey = 30 // Limit Apikey default
keymongodb = process.env.mongodb // Database Mongodb Setting
usetempemail = false // kalau true boleh sing up pakai email temp kalau pakai service gmail pakai false je
hostemail = process.env.hostemail // Host Email SMTP
sendemail = process.env.sendemail // Email SMTP
pwsendemail = process.env.pwsendemail // Password Email SMTP
fromsendemail = process.env.fromsendemail // Custom Email atau Sama dengan Email SMTP
domain = 'pg.wbk.web.id'// Domain Website tanpa http or https
recaptcha_key_1 = process.env.recaptcha_key_1 // Site Key Recaptcha
recaptcha_key_2 = process.env.recaptcha_key_2 // Secret Key Recaptcha

// Sesuaikan dengan Data Orderkuota
orderkuota = {
    username: "OK388034",
    merchantId: "OK388034",
    token: "388034:XZWugfYxmwEc3oMrbTejIn1AvU45SLQ8"
}

// Sesuikan dengan Data AtlanticH2H
atlantic = {
    apikey: "NirRZg15qUr4JMoNTQyVfrSyoYSNeKDQ718BqC6hOzYePSlcDHQfIyuWSFyICm23sChhKNm9JmvBNvu59oMqdreZbkPjaYF3Cd55"
}

// Log Handler
loghandler = {
    error: {
        status: false,
        code: 503,
        message: 'Service Unavaible or Error!',
        creator: `${creator}`
    },
    notfound: {
        status: false,
        code: 404,
        message: 'Forbiden or Error, Not Found!',
        creator: `${creator}`
    },
    register: {
        status: false,
        code: 403,
        message: 'Please Register First!',
    },
    verify: {
        status: false,
        code: 403,
        message: 'Please Verify Your Email!',
    }

}



