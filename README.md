# TypeRush

A gamified typing speed and accuracy trainer built with HTML, CSS, 
and JavaScript on the frontend and Node.js, Express, and MongoDB on 
the backend.

## Project Description
Our project is a **Typing Speed Game**. Instead of making a normal typing speed test, we want to make it more fun by turning it into a game. The player will type words or sentences as quickly and accurately as possible before the time runs out. The game will measure typing speed, accuracy, and score.

The goal of the project is to help users improve their typing skills in an interactive and enjoyable way. By adding game elements, the project becomes more engaging than a regular typing test.

### Game Features
- Real-time WPM (words per minute) and accuracy tracking
- Lives system — lose a life for too many errors
- Score multiplier streak — consecutive correct words boost your score
- Three content modes: random words, full sentences, and code snippets
- Personal best tracking across sessions
- Session history

## Tech Stack

### Frontend
- HTML, CSS, JavaScript
- Hosted on Vercel

### Backend
- Node.js + Express — REST API server
- MongoDB Atlas — cloud database for persistent session storage
- Mongoose — schema validation and database queries
- dotenv — environment variable management
- CORS — cross-origin request handling
- Hosted on Render

## Backend API

### Live URL
`https://typerush-5imc.onrender.com`

> Note: The server spins down after 15 minutes of inactivity on the 
> free tier which was used for this project. The first request after inactivity may take 30-60 seconds 
> to respond.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check — confirms API is running |
| GET | `/content/:mode` | Returns 30 random items for the given mode (`words`, `sentences`, `code`) |
| POST | `/sessions` | Saves a completed game session |
| GET | `/sessions/best` | Returns the highest WPM session on record |
| GET | `/sessions/history` | Returns the last 10 sessions, most recent first |

### Session Object Format

When saving a session via POST /sessions, the request body must include:

```json
{
  "wpm": 75,
  "accuracy": 94.2,
  "score": 1200,
  "mode": "words"
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `wpm` | Number | Words per minute — (chars typed / 5) / minutes elapsed |
| `accuracy` | Number | Percentage of correct keystrokes — 0 to 100 |
| `score` | Number | Gamified score combining WPM, accuracy, and streak multiplier |
| `mode` | String | Content type — `words`, `sentences`, or `code` |

## Installation & Local Setup (this section is not necessary if you access the game via the public URL)

### Prerequisites
- Node.js v20 or higher
- A MongoDB Atlas account and cluster
- Git

### Clone the repository
```bash
git clone https://gits-15.sys.kth.se/lovwic/projinda26_speedtyping
cd projinda26_speedtyping
```

### Running the backend locally

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file inside `/backend` with the following:
```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`. Open to see in browser.

### Running the frontend locally

> TO BE UPDATED

## Important Notes

- Never commit the `.env` file — it contains database credentials
- The `.env` file is listed in `.gitignore` and must be created locally
- For local setup, create a personal free MongoDB Atlas account and cluster

