
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const validModes = ['words', 'sentences', 'code'];

router.get('/:mode', (req, res) => {
    const mode = req.params.mode;

    // Validate the mode
    if (!validModes.includes(mode)) {
        return res.status(400).json({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` });
    }

    // Build the file path
    const filePath = path.join(__dirname, '../../content', `${mode}.json`);

    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    const items = data[mode];

    // Return a random selection of 30 items
    const shuffled = items.sort(() => Math.random() - 0.5);
    const selection = shuffled.slice(0, 30);

    res.json({mode, content: selection });

});

module.exports = router;