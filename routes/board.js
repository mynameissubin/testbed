// routes/board.js

const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const fs = require('fs');

// 파일 저장 경로와 파일명 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // 업로드할 파일이 저장될 디렉토리 설정
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // 업로드된 파일의 이름 설정
    }
});

// 파일 업로드를 처리할 미들웨어 생성
const upload = multer({ storage: storage });

// 새로운 게시글 작성 양식 표시
router.get('/new', (req, res) => {
    res.render('new_post', { user: req.session.user });
});

// 파일 업로드를 처리하는 라우터
router.post('/', upload.single('file'), (req, res) => {
    const { title, content } = req.body;
    const user_id = req.session.user.id;
    const file = req.file;
    const file_path = file ? file.path : null;
    const file_name = file ? file.filename : null;
    
    db.query('INSERT INTO posts (title, content, user_id, file_path, file_name) VALUES (?, ?, ?, ?, ?)', [title, content, user_id, file_path, file_name], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시글 작성 중 오류가 발생했습니다.');
        } else {
            // 게시글 생성 후 파일 정보를 files 테이블에 삽입
            const post_id = result.insertId;
            if (file_name && file_path) {
                db.query('INSERT INTO files (post_id, file_name, file_path) VALUES (?, ?, ?)', [post_id, file_name, file_path], (err, result) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('파일 정보를 저장하는 중 오류가 발생했습니다.');
                    } else {
                        res.redirect('board_main');
                    }
                });
            } else {
                res.redirect('board_main');
            }
        }
    });
});


// 게시글 상세 내용 조회
router.get('/:id', (req, res) => {
    const post_id = req.params.id;
    db.query('SELECT * FROM posts WHERE post_id = ?', [post_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시글을 불러오는 중 오류가 발생했습니다.');
        } else {
            const post = results[0];
            if (post.file_path) {
                // 파일이 있는 경우에만 파일 다운로드 버튼 생성
                res.render('post_details', { post, user: req.session.user });
            } else {
                res.render('post_details', { post, user: req.session.user, fileDownload: false });
            }
        }
    });
});

// 게시글 수정 양식 표시
router.get('/:id/edit', (req, res) => {
    const post_id = req.params.id;
    db.query('SELECT * FROM posts WHERE post_id = ?', [post_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching post details');
        } else {
            res.render('edit_post', { post: results[0] });
        }
    });
});


// 게시글 수정 처리
router.put('/:id', upload.single('file'), (req, res) => {
    const post_id = req.params.id;
    const { title, content } = req.body;
    const file = req.file;
    const file_path = file ? file.path : null;
    const file_name = file ? file.filename : null;
    
    // 이전 파일 정보 가져오기
    db.query('SELECT file_path FROM posts WHERE post_id = ?', [post_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching file information');
        } else {
            const old_file_path = results[0].file_path;

            // 게시글 업데이트
            db.query('UPDATE posts SET title = ?, content = ?, file_path = ?, file_name = ? WHERE post_id = ?', [title, content, file_path, file_name, post_id], (err, result) => {
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
                        db.query('UPDATE files SET file_name = ?, file_path = ? WHERE post_id = ?', [file_name, file_path, post_id], (err, result) => {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error updating file information');
                            } else {
                                console.log('File information updated successfully');
                                res.redirect(`/board_main/${post_id}`);
                            }
                        });
                    } else {
                        res.redirect(`/board_main/${post_id}`);
                    }
                }
            });
        }
    });
});

// 게시글 삭제 처리
router.delete('/:id', (req, res) => {
    const post_id = req.params.id;
    //const user_id = req.session.user.id;
    
    // 데이터베이스에서 파일 경로 가져오기
    db.query('SELECT file_path FROM posts WHERE post_id = ?', [post_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching file information');
        } else {
            const file_path = results[0].file_path;

            // 데이터베이스에서 게시글 삭제
            db.query('DELETE FROM posts WHERE post_id = ?', [post_id], (err, result) => {
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
                    res.redirect('/board_main');
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

    const sql = `SELECT * FROM posts WHERE title LIKE '%${keyword}%' OR content LIKE '%${keyword}%'`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('게시글을 가져오는 중 오류가 발생했습니다.');
        } else {
            res.render('board_main', { posts: results, keyword: keyword });
        }
    });
});

module.exports = router;
