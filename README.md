# testbed
모의해킹 TestBed

database table

CREATE TABLE users (
	id varchar(50) not null PRIMARY KEY,
	name VARCHAR(50) NOT NULL,
	email VARCHAR(50) NOT NULL,
	password VARCHAR(255) NOT NULL
	);

CREATE TABLE posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARVHAR(255),
    file_name VARVHAR(255)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

CREATE TABLE files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
); 

CREATE TABLE notices (
    notice_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_name VARCHAR(255),
    file_path VARCHAR(255)
);

CREATE TABLE notice_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notice_id INT,
    FOREIGN KEY (notice_id) REFERENCES notices(notice_id) ON DELETE CASCADE
);
