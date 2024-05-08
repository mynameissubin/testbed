// routes/index.js

const express = require('express');
const router = express.Router();

// 메인 페이지 렌더링
router.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

module.exports = router;

