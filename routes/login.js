// routes/login.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', (req, res) => {
    const { id, password } = req.body;
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        if (err) {
            res.status(500).send('Error logging in');
        } else {
            if (results.length > 0) {
                const user = results[0];
                if (bcrypt.compareSync(password, user.password)) {
                    req.session.user = user;
                    res.redirect('/');
                } else {
                    res.render('login', { error: 'Incorrect password' });
                }
            } else {
                res.render('login', { error: 'User not found' });
            }
        }
    });
});


module.exports = router;

