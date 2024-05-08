// routes/register.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => {
    res.render('register');
});

router.post('/', (req, res) => {
    const { id, name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // 회원가입 쿼리 실행
    db.query('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)', [id, name, email, hashedPassword], (err, result) => {
        if (err) {
            console.error('Error registering user:', err.message);
            res.status(500).send('Error registering user');
        } else {
            res.render('login'); // 회원가입 후 로그인 페이지를 렌더링
        }
    });
});

module.exports = router;

