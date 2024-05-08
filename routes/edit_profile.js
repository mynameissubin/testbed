// routes/edit_profile.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => {
    // 세션에서 현재 로그인한 사용자의 정보를 가져옴
    const user = req.session.user;
    if (!user) {
        // 사용자 정보가 없는 경우 로그인 페이지로 리다이렉트
        res.redirect('/login');
    } else {
        res.render('edit_profile', { user });
    }
});

router.post('/', (req, res) => {
    const { id, name, email, password } = req.body;

    // 회원 정보 업데이트를 위한 쿼리
    let query = 'UPDATE users SET name = ?, email = ?';
    let params = [name, email];

    // 비밀번호를 변경하는 경우에만 해싱 처리
    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    // 회원 정보 업데이트 쿼리 실행
    db.query(query, params, (err, results) => {
        if (err) {
            // 업데이트 실패
            console.error(err);
            res.status(500).send('Error updating user');
        } else {
            // 업데이트 성공
            res.redirect('/');
        }
    });
});

module.exports = router;
