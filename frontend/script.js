// =========================
// Screen switching and buttons
// =========================

// Get references to each screen from HTML.
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");

// Get buttons. Same idea, but for buttons.
const startBtn = document.getElementById("start-btn");
const finishBtn = document.getElementById("finish-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const backMenuBtn = document.getElementById("back-menu-btn");

// Function to show one screen and hide the others.
function showScreen(screen) {
  // Hide all screens
  menuScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  resultsScreen.classList.add("hidden");

  // Shows selected screen, so that the one you choose becomes visible.
  screen.classList.remove("hidden");
}

// When Start Game is clicked -> switch to the game screen.
// addEventListener waits for user action and respond to it.
startBtn.addEventListener("click", function () {
  showScreen(gameScreen);
});

// When Finish is clicked -> switch to results screen.
finishBtn.addEventListener("click", function () {
  showScreen(resultsScreen);
});

// Reloads the page so the game variables reset completely
playAgainBtn.addEventListener("click", function () {
  location.reload();
});

// Back to menu -> return to main menu
backMenuBtn.addEventListener("click", function () {
  showScreen(menuScreen);
});

// =========================
// Results screen logic
// =========================

// Get result elements from the HTML so JavaScript can update them
const finalWpmElement = document.getElementById("final-wpm");
const finalAccuracyElement = document.getElementById("final-accuracy");
const finalScoreElement = document.getElementById("final-score");
const personalBestElement = document.getElementById("personal-best");
const finalModeElement = document.getElementById("final-mode");
const newBestBadge = document.getElementById("new-best-badge");

// Stores the player's best WPM from the backend
let personalBestWpm = 0;

// Loads the personal best from Person C's backend route.
// Full route = /sessions + /best = /sessions/best
async function loadPersonalBest() {
  try {
    const response = await fetch("http://localhost:5000/sessions/best");

    // 404 means no saved sessions exist yet, so personal best stays 0
    if (response.status === 404) {
      personalBestWpm = 0;
      personalBestElement.textContent = "0";
      return;
    }

    // Stop if another backend error happens
    if (!response.ok) {
      console.error("Failed to load personal best");
      return;
    }

    const bestSession = await response.json();

    // If backend returns a best session, display its WPM
    if (bestSession && bestSession.wpm) {
      personalBestWpm = bestSession.wpm;
      personalBestElement.textContent = String(personalBestWpm);
    }
  } catch (error) {
    // Prevents the frontend from crashing if backend is not running
    console.error("Could not load personal best:", error);
  }
}

// Fills the results screen with real session data from Person A's input.js
function populateResultsScreen(sessionResult) {
  const finalWpm = sessionResult.wpm;
  const finalAccuracy = sessionResult.accuracy;
  const finalScore = sessionResult.score;
  const finalMode = sessionResult.mode;

  // Check if this session beats the saved personal best
  const isNewBest = finalWpm > personalBestWpm;

  if (isNewBest) {
    personalBestWpm = finalWpm;
    newBestBadge.classList.remove("hidden");
  } else {
    newBestBadge.classList.add("hidden");
  }

  // Update the results screen values
  finalWpmElement.textContent = String(finalWpm);
  finalAccuracyElement.textContent = Number(finalAccuracy).toFixed(1) + "%";
  finalScoreElement.textContent = String(finalScore);
  personalBestElement.textContent = String(personalBestWpm);
  finalModeElement.textContent = finalMode;
}

// Person A's input.js sends this event when the game ends
document.addEventListener("sessionend", function (event) {
  populateResultsScreen(event.detail);
  showScreen(resultsScreen);
});

// Load personal best when the page opens
loadPersonalBest();