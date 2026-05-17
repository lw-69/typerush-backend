
// sessions.js - handles session-related routes for saving and retrieving typing sessions

const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

const validModes = ['words', 'sentences', 'code'];

// POST /sessions - save a completed session
router.post('/', async(req, res) => {
    try {
        const { wpm, accuracy, score, mode, difficulty } = req.body; 

        if(!wpm || !accuracy || !score || !mode ) {
            return res.status(400).json({ error: 'Missing required fields: wpm, accuracy, score, mode'});
        }

        if(!validModes.includes(mode)) {
            return res.status(400).json({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}`});
        }

        const session = new Session({ wpm, accuracy, score, mode, difficulty });
        const savedSession = await session.save();

        res.status(201).json(savedSession);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /sessions/best - return highest WPM
router.get('/best', async(req, res) => {
    try {
        const best = await Session.findOne().sort({ wpm: -1 });

        if (!best) {
            return res.status(404).json({ message: 'No sessions found yet' });
        }

        res.json(best);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /sessions/history - return last 10 sessions
router.get('/history', async(req, res) => {
    try {
        const history = await Session.find().sort({ timestamp: -1 }).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

module.exports = router; 