
const express = require('express'); // imports Express library
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows frontend to access backend resources (the server) without getting blocked
app.use(express.json()); // Tells Express to automatically parse incoming JSON data in request bodies

// Test Route
app.get('/', (req, res) => { // Defines a route: when someone visits the root URL ("/"), send back this JSON response
  res.json({ message: 'Speed Typing API is running!'});
});

// Start Server
app.listen(PORT, () => { // Starts the server and tells it to listen for requests on port
    console.log(`Server is running on port ${PORT}`);
});