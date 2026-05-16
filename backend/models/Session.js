
/**
 * Session model for storing typing session data in MongoDB.
 * Each session document will contain:
 * - wpm: Words per minute (Number, required)
 * - accuracy: Accuracy percentage (Number, required)
 * - score: Overall score (Number, required)
 * - mode: Typing mode (String, required, must be 'words', 'sentences', or 'code')
 * - difficulty: Typing difficulty (String, not required as default is 'medium', must be 'easy', 'medium' or 'hard')
 * - timestamp: Date and time when the session was recorded (Date, defaults to current date/time)
 * 
 * This model will be used to create and manage session records in the MongoDB database.
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    wpm: {
        type: Number,
        required: true // field is required, otherwise Mongoose rejects the document and throws a validation error
    },
    accuracy: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    mode: {
        type: String,
        enum: ['words', 'sentences', 'code'], // restricts the value of mode to be one of these three options, helps maintain data integrity
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: false,
        default: 'medium'
    },
    timestamp: {
        type: Date,
        default: Date.now // If no timestamp is provided when creating a session, it will automatically set to the current date and time
    },
    keyAccuracy: { 
        type: Map, 
        of: Object, 
        required: false 
    }
});

module.exports = mongoose.model('Session', sessionSchema); // Exports the Session model based on the sessionSchema, allowing it to be imported and used in other files (like routes) to create and manage session records in the MongoDB database