// db.js

const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // your MySQL username
    password: '1234', // your MySQL password
    database: 'database' // your MySQL database name
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

module.exports = db;
