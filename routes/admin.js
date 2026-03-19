const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const bcrypt = require('bcryptjs');
const { body, param, query, validationResult } = require('express-validator');

// Simple admin auth middleware (demo - use sessions/JWT in production)
const adminAuth = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const b64 = auth.slice(6);
    let credentials;
    try {
        credentials = Buffer.from(b64, 'base64').toString().split(':');
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid authorization' });
    }
    const [username, password] = credentials;
    const [rows] = await pool.query(
        'SELECT id, password_hash FROM users WHERE username = ? AND role = ?',
        [username, 'admin']
    );
    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    req.adminId = rows[0].id;
    next();
};

router.use(adminAuth);

// List all quizzes (including inactive)
router.get('/quizzes', async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT q.id, q.title, q.description, q.duration_minutes, q.is_active, 
                    q.created_at, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
             FROM quizzes q
             ORDER BY q.updated_at DESC`
        );
        res.json({ success: true, quizzes: rows });
    } catch (err) {
        next(err);
    }
});

// Create quiz
router.post('/quizzes', [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('duration_minutes').isInt({ min: 1, max: 480 }),
    body('is_active').optional().isBoolean()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { title, description, duration_minutes, is_active = true } = req.body;
        const [r] = await pool.query(
            'INSERT INTO quizzes (title, description, duration_minutes, is_active, created_by) VALUES (?, ?, ?, ?, ?)',
            [title, description || null, duration_minutes, is_active ? 1 : 0, req.adminId]
        );
        res.status(201).json({ success: true, id: r.insertId });
    } catch (err) {
        next(err);
    }
});

// Update quiz
router.put('/quizzes/:id', [
    param('id').isInt({ min: 1 }),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('duration_minutes').optional().isInt({ min: 1, max: 480 }),
    body('is_active').optional().isBoolean()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { title, description, duration_minutes, is_active } = req.body;
        const updates = [];
        const values = [];
        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (duration_minutes !== undefined) { updates.push('duration_minutes = ?'); values.push(duration_minutes); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        values.push(req.params.id);
        await pool.query(
            `UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// Delete quiz
router.delete('/quizzes/:id', [param('id').isInt({ min: 1 })], async (req, res, next) => {
    try {
        const [r] = await pool.query('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
        if (r.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// Add question to quiz
router.post('/quizzes/:quizId/questions', [
    param('quizId').isInt({ min: 1 }),
    body('question_text').trim().notEmpty(),
    body('points').optional().isInt({ min: 1 }).withMessage('Points must be at least 1'),
    body('question_order').optional().isInt({ min: 1 }),
    body('answers').isArray({ min: 2 }).withMessage('At least 2 answers required'),
    body('answers.*.answer_text').trim().notEmpty(),
    body('answers.*.is_correct').isBoolean(),
    body('answers').custom((arr) => {
        const correctCount = arr.filter(a => a.is_correct).length;
        if (correctCount !== 1) throw new Error('Exactly one answer must be marked correct');
        return true;
    })
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { question_text, points = 1, question_order, answers } = req.body;
        const quizId = parseInt(req.params.quizId);

        const [maxOrder] = await pool.query(
            'SELECT COALESCE(MAX(question_order), 0) + 1 as next_order FROM questions WHERE quiz_id = ?',
            [quizId]
        );
        const order = question_order || maxOrder[0].next_order;

        const [qr] = await pool.query(
            'INSERT INTO questions (quiz_id, question_text, question_order, points) VALUES (?, ?, ?, ?)',
            [quizId, question_text, order, points]
        );
        const questionId = qr.insertId;

        for (let i = 0; i < answers.length; i++) {
            await pool.query(
                'INSERT INTO answers (question_id, answer_text, is_correct, answer_order) VALUES (?, ?, ?, ?)',
                [questionId, answers[i].answer_text, answers[i].is_correct ? 1 : 0, i + 1]
            );
        }
        res.status(201).json({ success: true, question_id: questionId });
    } catch (err) {
        next(err);
    }
});

// Update question
router.put('/questions/:id', [
    param('id').isInt({ min: 1 }),
    body('question_text').optional().trim().notEmpty(),
    body('points').optional().isInt({ min: 1 }),
    body('question_order').optional().isInt({ min: 1 })
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { question_text, points, question_order } = req.body;
        const updates = [];
        const values = [];
        if (question_text !== undefined) { updates.push('question_text = ?'); values.push(question_text); }
        if (points !== undefined) { updates.push('points = ?'); values.push(points); }
        if (question_order !== undefined) { updates.push('question_order = ?'); values.push(question_order); }
        if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
        values.push(req.params.id);
        await pool.query(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// Delete question
router.delete('/questions/:id', [param('id').isInt({ min: 1 })], async (req, res, next) => {
    try {
        const [r] = await pool.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
        if (r.affectedRows === 0) return res.status(404).json({ success: false, message: 'Question not found' });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// Get results/attempts for a quiz
router.get('/quizzes/:id/results', [param('id').isInt({ min: 1 })], async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT qa.id, qa.started_at, qa.submitted_at, qa.time_taken_seconds, qa.score, qa.max_score,
                    ROUND((qa.score / NULLIF(qa.max_score, 0)) * 100, 1) as percentage
             FROM quiz_attempts qa
             WHERE qa.quiz_id = ? AND qa.submitted_at IS NOT NULL
             ORDER BY qa.submitted_at DESC`,
            [req.params.id]
        );
        res.json({ success: true, results: rows });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
