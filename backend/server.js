
const express = require('express'); // imports Express library
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db'); // imports the connectDB function from db.js to establish a database connection
const contentRoutes = require('./routes/content');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB(); // Calls the function to connect to the database when the server starts

// Middleware
app.use(cors()); // Allows frontend to access backend resources (the server) without getting blocked
app.use(express.json()); // Tells Express to automatically parse incoming JSON data in request bodies

// Routes
app.use('/content', contentRoutes);

// Test Route
app.get('/', (req, res) => { // Defines a route: when someone visits the root URL ("/"), send back this JSON response
  res.json({ message: 'Speed Typing API is running!'});
});

// Start Server
app.listen(PORT, () => { // Starts the server and tells it to listen for requests on port
    console.log(`Server is running on port ${PORT}`);
});