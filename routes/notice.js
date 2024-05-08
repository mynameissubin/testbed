// routes/notice.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const fs = require('fs');

// 사용자 역할 확인하는 미들웨어
function checkUserRole(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next(); // 다음 미들웨어로 이동
    } else {
        res.status(403).send('관리자만 접근할 수 있는 페이지입니다.');
    }
}

// 파일 저장 경로와 파일명 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 업로드할 파일이 저장될 디렉토리 설정
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // 업로드된 파일의 이름 설정
    }
});

// 파일 업로드를 처리할 미들웨어 생성
const upload = multer({ storage: storage });

// 새로운 게시글 작성 양식 표시
router.get('/new', checkUserRole, (req, res) => {
    res.render('new_notice', { user: req.session.user });
});

// 파일 업로드를 처리하는 라우터
router.post('/', checkUserRole, upload.single('file'), (req, res) => {
    const { title, content } = req.body;
    const file = req.file;
    const file_path = file ? file.path : null;
    const file_name = file ? file.filename : null;
    
    db.query('INSERT INTO notices (title, content, file_path, file_name) VALUES (?, ?, ?, ?)', [title, content, file_path, file_name], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시글 작성 중 오류가 발생했습니다.');
        } else {
            // 게시글 생성 후 파일 정보를 notice_files 테이블에 삽입
            const notice_id = result.insertId;
            if (file_name && file_path) {
                db.query('INSERT INTO notice_files (notice_id, file_name, file_path) VALUES (?, ?, ?)', [notice_id, file_name, file_path], (err, result) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('파일 정보를 저장하는 중 오류가 발생했습니다.');
                    } else {
                        res.redirect('/notices');
                    }
                });
            } else {
                res.redirect('/notices');
            }
        }
    });
});

// 게시글 상세 내용 조회
router.get('/:id', (req, res) => {
    const notice_id = req.params.id;
    db.query('SELECT * FROM notices WHERE notice_id = ?', [notice_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시글을 불러오는 중 오류가 발생했습니다.');
        } else {
            const notice = results[0];
            if (notice.file_path) {
                // 파일이 있는 경우에만 파일 다운로드 버튼 생성
                res.render('notice_details', { notice, user: req.session.user });
            } else {
                res.render('notice_details', { notice, user: req.session.user, fileDownload: false });
            }
        }
    });
});

// 게시글 수정 양식 표시
router.get('/:id/edit', checkUserRole, (req, res) => {
    const notice_id = req.params.id;
    db.query('SELECT * FROM notices WHERE notice_id = ?', [notice_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching post details');
        } else {
            res.render('edit_notice', { notice: results[0] }); // 수정: post -> notice
        }
    });
});

// 게시글 수정 처리
router.put('/:id', checkUserRole, upload.single('file'), (req, res) => {
    const notice_id = req.params.id;
    const { title, content } = req.body;
    const file = req.file;
    const file_path = file ? file.path : null;
    const file_name = file ? file.filename : null;
    
    // 이전 파일 정보 가져오기
    db.query('SELECT file_path FROM notices WHERE notice_id = ?', [notice_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching file information');
        } else {
            const old_file_path = results[0].file_path;

            // 게시글 업데이트
            db.query('UPDATE notices SET title = ?, content = ?, file_path = ?, file_name = ? WHERE notice_id = ?', [title, content, file_path, file_name, notice_id], (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error updating post');
                } else {
                    // 이전 파일 삭제
                    if (old_file_path) {
                        fs.unlink(old_file_path, (err) => {
                            if (err) {
                                console.error('Error deleting old file:', err);
                            } else {
                                console.log('Old file deleted successfully:', old_file_path);
                            }
                        });
                    }
                    // 파일 정보 업데이트
                    if (file_name && file_path) {
                        db.query('UPDATE notice_files SET file_name = ?, file_path = ? WHERE notice_id = ?', [file_name, file_path, notice_id], (err, result) => {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error updating file information');
                            } else {
                                console.log('File information updated successfully');
                                res.redirect(`/notices/${notice_id}`);
                            }
                        });
                    } else {
                        res.redirect(`/notices/${notice_id}`);
                    }
                }
            });
        }
    });
});

// 게시글 삭제 처리
router.delete('/:id', checkUserRole, (req, res) => {
    const notice_id = req.params.id;
    
    // 데이터베이스에서 파일 경로 가져오기
    db.query('SELECT file_path FROM notices WHERE notice_id = ?', [notice_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching file information');
        } else {
            const file_path = results[0].file_path;

            // 데이터베이스에서 게시글 삭제
            db.query('DELETE FROM notices WHERE notice_id = ?', [notice_id], (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error deleting post');
                } else {
                    // 파일 시스템에서 파일 삭제
                    if (file_path) {
                        fs.unlink(file_path, (err) => {
                            if (err) {
                                console.error('Error deleting file:', err);
                            } else {
                                console.log('File deleted successfully:', file_path);
                            }
                        });
                    }
                    res.redirect('/notices');
                }
            });
        }
    });
});

// 파일 삭제 미들웨어 생성
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
        } else {
            console.log('File deleted successfully:', filePath);
        }
    });
}

// 파일 다운로드를 처리하는 라우터
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = `uploads/${filename}`;

    // 파일 존재 여부 확인 후 다운로드
    fs.access(filepath, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            res.download(filepath);
        }
    });
});

// 게시글 목록 조회
router.get('/', (req, res) => {
    let keyword = req.query.keyword || ''; // 검색어가 없으면 빈 문자열

    const sql = `SELECT * FROM notices WHERE title LIKE '%${keyword}%' OR content LIKE '%${keyword}%'`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시글을 가져오는 중 오류가 발생했습니다.');
        } else {
            res.render('notices', { notices: results, keyword: keyword, user: req.session.user }); // user 객체를 템플릿으로 전달
        }
    });
});

module.exports = router;
