const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { body, param, validationResult } = require('express-validator');

// Get all active quizzes (no auth for demo - add auth middleware as needed)
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT q.id, q.title, q.description, q.duration_minutes, 
                    (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
             FROM quizzes q 
             WHERE q.is_active = 1 
             ORDER BY q.created_at DESC`
        );
        res.json({ success: true, quizzes: rows });
    } catch (err) {
        next(err);
    }
});

// Get quiz details (no answers) for starting
router.get('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Invalid quiz ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const [rows] = await pool.query(
            'SELECT id, title, description, duration_minutes FROM quizzes WHERE id = ? AND is_active = 1',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        const quiz = rows[0];
        const [questions] = await pool.query(
            `SELECT id, question_text, question_order, points 
             FROM questions 
             WHERE quiz_id = ? 
             ORDER BY question_order, id`,
            [req.params.id]
        );
        const [answersByQ] = await pool.query(
            `SELECT id, question_id, answer_text, answer_order 
             FROM answers 
             WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = ?)
             ORDER BY question_id, answer_order, id`,
            [req.params.id]
        );
        const answersByQuestion = {};
        answersByQ.forEach(a => {
            if (!answersByQuestion[a.question_id]) answersByQuestion[a.question_id] = [];
            answersByQuestion[a.question_id].push({ id: a.id, answer_text: a.answer_text });
        });
        const questionsWithOptions = questions.map(q => ({
            ...q,
            options: answersByQuestion[q.id] || []
        }));
        res.json({
            success: true,
            quiz: { ...quiz, questions: questionsWithOptions }
        });
    } catch (err) {
        next(err);
    }
});

// Start quiz attempt - returns attempt_id and server start time for timer
router.post('/:id/start', [
    param('id').isInt({ min: 1 }).withMessage('Invalid quiz ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const [quiz] = await pool.query(
            'SELECT id, duration_minutes FROM quizzes WHERE id = ? AND is_active = 1',
            [req.params.id]
        );
        if (quiz.length === 0) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        const [result] = await pool.query(
            'INSERT INTO quiz_attempts (quiz_id) VALUES (?)',
            [req.params.id]
        );
        const [start] = await pool.query('SELECT NOW() as server_time');
        res.json({
            success: true,
            attempt_id: result.insertId,
            duration_minutes: quiz[0].duration_minutes,
            server_start_time: start[0].server_time
        });
    } catch (err) {
        next(err);
    }
});

// Submit quiz - validates time, calculates score, persists results
router.post('/:id/submit', [
    param('id').isInt({ min: 1 }),
    body('attempt_id').isInt({ min: 1 }),
    body('answers').isArray(),
    body('answers.*.question_id').isInt({ min: 1 }),
    body('answers.*.answer_id').isInt({ min: 1 })
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { attempt_id, answers } = req.body;
        const quizId = parseInt(req.params.id);

        const [attempt] = await pool.query(
            'SELECT id, quiz_id, started_at, submitted_at FROM quiz_attempts WHERE id = ? AND quiz_id = ?',
            [attempt_id, quizId]
        );
        if (attempt.length === 0) {
            return res.status(404).json({ success: false, message: 'Attempt not found' });
        }
        if (attempt[0].submitted_at) {
            return res.status(400).json({ success: false, message: 'Quiz already submitted' });
        }

        const [quiz] = await pool.query(
            'SELECT duration_minutes FROM quizzes WHERE id = ?',
            [quizId]
        );
        const durationMs = quiz[0].duration_minutes * 60 * 1000;
        const startedAt = new Date(attempt[0].started_at).getTime();
        const now = Date.now();
        const timeTaken = Math.floor((now - startedAt) / 1000);
        if (timeTaken > durationMs / 1000) {
            return res.status(400).json({
                success: false,
                message: 'Time expired. Quiz submission rejected.'
            });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            for (const a of answers) {
                await conn.query(
                    'INSERT INTO attempt_answers (attempt_id, question_id, answer_id) VALUES (?, ?, ?)',
                    [attempt_id, a.question_id, a.answer_id]
                );
            }

            const [scoreResult] = await conn.query(
                `SELECT 
                    COALESCE(SUM(q.points), 0) as earned,
                    (SELECT COALESCE(SUM(points), 0) FROM questions WHERE quiz_id = ?) as max_possible
                 FROM attempt_answers aa
                 JOIN answers an ON aa.answer_id = an.id AND an.is_correct = 1
                 JOIN questions q ON aa.question_id = q.id
                 WHERE aa.attempt_id = ?`,
                [quizId, attempt_id]
            );
            const earned = parseFloat(scoreResult[0]?.earned || 0);
            const maxPossible = parseInt(scoreResult[0]?.max_possible || 0);

            await conn.query(
                'UPDATE quiz_attempts SET submitted_at = NOW(), time_taken_seconds = ?, score = ?, max_score = ? WHERE id = ?',
                [timeTaken, earned, maxPossible, attempt_id]
            );
            await conn.commit();

            res.json({
                success: true,
                score: earned,
                max_score: maxPossible,
                percentage: maxPossible > 0 ? Math.round((earned / maxPossible) * 100) : 0,
                time_taken_seconds: timeTaken
            });
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
