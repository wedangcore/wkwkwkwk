const LocalStrategy = require('passport-local').Strategy;
const User = require('../model/user');
const bcryptjs = require('bcryptjs');

module.exports = function(passport) {
    passport.use(new LocalStrategy({
        // Field dari form login.ejs Anda
        usernameField: 'username' 
    }, (username, password, done) => {
        // Logika untuk mencari user berdasarkan email ATAU username
        const query = (username.includes('@')) 
            ? { email: username.toLowerCase() } 
            : { username: username };

        User.findOne(query)
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'Username atau email tidak terdaftar.' });
                }

                // Cocokkan password
                bcryptjs.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password salah.' });
                    }
                });
            })
            .catch(err => console.log(err));
    }));

    // Serialisasi user untuk session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialisasi user dari session
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
};