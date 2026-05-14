
const mongoose = require('mongoose');

const connectDB = async () => { // Asynchronous function because connecting to a remote database takes time, need to wait for it
    try { // try/catch handles errors by logging why and exiting the process if connection fails
        await mongoose.connect(process.env.MONGO_URI); // takes connection string and opens connection to MongoDB Atlas
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Connection to MongoDB failed:', error);
        process.exit(1); // Exit the process with an error code
    }
};

module.exports = connectDB; // Exports the connectDB function so it can be imported and used in other files (like server.js) to establish a database connection when the server starts