require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'online_quiz_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDb() {
    const fs = require('fs');
    const path = require('path');
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });
    
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
    
    for (const stmt of statements) {
        if (stmt) await conn.query(stmt);
    }
    
    await conn.query('USE online_quiz_db');
    const hash = await bcrypt.hash('admin123', 10);
    await conn.query(
        'INSERT IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        ['admin', hash, 'admin']
    );
    const [quizzes] = await conn.query('SELECT id FROM quizzes LIMIT 1');
    if (quizzes.length === 0) {
        const [qr] = await conn.query(
            'INSERT INTO quizzes (title, description, duration_minutes, is_active) VALUES (?, ?, ?, 1)',
            ['Sample Quiz', 'A quick demo quiz to get started.', 2]
        );
        const qId = qr.insertId;
        await conn.query(
            'INSERT INTO questions (quiz_id, question_text, question_order, points) VALUES (?, ?, 1, 1)',
            [qId, 'What is 2 + 2?']
        );
        const [q1] = await conn.query('SELECT id FROM questions WHERE quiz_id = ? LIMIT 1', [qId]);
        const q1Id = q1[0].id;
        await conn.query(
            'INSERT INTO answers (question_id, answer_text, is_correct, answer_order) VALUES (?, ?, 0, 1), (?, ?, 1, 2), (?, ?, 0, 3), (?, ?, 0, 4)',
            [q1Id, '3', q1Id, '4', q1Id, '5', q1Id, '6']
        );
        await conn.query(
            'INSERT INTO questions (quiz_id, question_text, question_order, points) VALUES (?, ?, 2, 1)',
            [qId, 'Which language is Node.js written in?']
        );
        const [q2] = await conn.query('SELECT id FROM questions WHERE quiz_id = ? ORDER BY id DESC LIMIT 1', [qId]);
        const q2Id = q2[0].id;
        await conn.query(
            'INSERT INTO answers (question_id, answer_text, is_correct, answer_order) VALUES (?, ?, 0, 1), (?, ?, 1, 2), (?, ?, 0, 3)',
            [q2Id, 'Python', q2Id, 'JavaScript', q2Id, 'Java']
        );
        console.log('Sample quiz created.');
    }
    await conn.end();
    console.log('Database initialized. Admin: admin / admin123');
}

module.exports = { pool, initDb };
