// routes/logout.js

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err.message);
            res.status(500).send('Error logging out');
        } else {
            res.redirect('/login'); // 로그아웃 후 로그인 페이지로 리디렉션
        }
    });
});

module.exports = router;
