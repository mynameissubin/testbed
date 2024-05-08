// routes/dashboard.js

const express = require('express');
const router = express.Router();
const db = require('../db');

// 대시보드 페이지 렌더링
router.get('/', (req, res) => {
    // 현재 로그인한 사용자의 정보를 세션에서 가져옴
    const currentUser = req.session.user;

    // 세션에서 사용자가 관리자인지 확인
    if (currentUser && currentUser.role === 'admin') {
        // 모든 사용자를 조회하여 대시보드에 표시
        db.query('SELECT * FROM users', (err, users) => {
            if (err) {
                console.error(err);
                res.status(500).send('사용자 정보를 가져오는 중 오류가 발생했습니다.');
            } else {
                res.render('dashboard', { users: users, currentUser: currentUser });
            }
        });
    } else {
        // 관리자가 아닌 경우 접근 권한 없음
        res.status(403).send('관리자만 접근할 수 있는 페이지입니다.');
    }
});

// 사용자 삭제 처리
router.post('/delete-user/:id', (req, res) => {
    const userId = req.params.id;

    db.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('사용자 삭제 중 오류가 발생했습니다.');
        } else {
            res.send('사용자가 성공적으로 삭제되었습니다.');
        }
    });
});

module.exports = router;
