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

// For game rules
const rulesScreen = document.getElementById("rules-screen");
const rulesBtn = document.getElementById("rules-btn");
const rulesBackBtn = document.getElementById("rules-back-btn");

// =========================
// Main menu selector logic
// =========================

// Stores the currently selected mode and difficulty.
// These values can later be used by the game logic/backend content routes.
let selectedMode = "words";
let selectedDifficulty = "easy";

// Get all mode and difficulty buttons
const modeButtons = document.querySelectorAll("[data-mode]");
const difficultyButtons = document.querySelectorAll("[data-difficulty]");
const modeDescription = document.getElementById("mode-description");

// Descriptions shown under the mode selector
const modeDescriptions = {
  words: "Practice with random words to build speed",
  sentences: "Type full sentences to practice flow and accuracy",
  code: "Practice typing short code snippets with symbols",
};

// Handles mode button clicks
modeButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    // Save selected mode
    selectedMode = button.dataset.mode;

    // Remove selected style from all mode buttons
    modeButtons.forEach(function (btn) {
      btn.classList.remove("selected");
    });

    // Add selected style to clicked button
    button.classList.add("selected");

    // Update description text
    modeDescription.textContent = modeDescriptions[selectedMode];
  });
});

// Handles difficulty button clicks
difficultyButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    // Save selected difficulty
    selectedDifficulty = button.dataset.difficulty;

    // Remove selected style from all difficulty buttons
    difficultyButtons.forEach(function (btn) {
      btn.classList.remove("selected");
    });

    // Add selected style to clicked button
    button.classList.add("selected");
  });
});

// Function to show one screen and hide the others.
function showScreen(screen) {
 
  menuScreen.classList.add("hidden");
  rulesScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  resultsScreen.classList.add("hidden");

  // Shows selected screen, so that the one you choose becomes visible.
  screen.classList.remove("hidden");
}

// When Start Game is clicked -> switch to the game screen.
// addEventListener waits for user action and respond to it.
// Starts the game using the selected mode and difficulty from the menu.
startBtn.addEventListener("click", function () {
  // Send selected mode to input.js
  mode = selectedMode;

  // Start Person A's game logic with the selected difficulty
  startGame(selectedDifficulty);

  // Show the game screen
  showScreen(gameScreen);
});

// Opens the game rules screen from the main menu
rulesBtn.addEventListener("click", function () {
  showScreen(rulesScreen);
});

// Returns from the rules screen back to the main menu
rulesBackBtn.addEventListener("click", function () {
  showScreen(menuScreen);
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
  location.reload();
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
const finalDifficultyElement = document.getElementById("final-difficulty");

// Stores the player's best score from the backend
let personalBestScore = 0;

// Loads the personal best from Person C's backend route.
// Full route = /sessions + /best = /sessions/best
async function loadPersonalBest() {
  try {
    const response = await fetch("https://typerush-5imc.onrender.com/sessions/best");

    // 404 means no saved sessions exist yet, so personal best stays 0
    if (response.status === 404) {
      personalBestScore = 0;
      personalBestElement.textContent = "0";
      return;
    }

    // Stop if another backend error happens
    if (!response.ok) {
      console.error("Failed to load personal best");
      return;
    }

    const bestSession = await response.json();

    // If backend returns a best session, display its score
    if (bestSession && bestSession.score) {
      personalBestScore = bestSession.score;
      personalBestElement.textContent = String(personalBestScore);
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
  const finalDifficulty = sessionResult.difficulty;

  // Displays difficulty on the results screen.
  finalDifficultyElement.textContent = finalDifficulty;   

  // Check if this session beats the saved personal best
  const isNewBest = finalScore > personalBestScore;

  if (isNewBest) {
    personalBestScore = finalScore;
    newBestBadge.classList.remove("hidden");
  } else {
    newBestBadge.classList.add("hidden");
  }

  // Update the results screen values
  finalWpmElement.textContent = String(finalWpm);
  finalAccuracyElement.textContent = Number(finalAccuracy).toFixed(1) + "%";
  finalScoreElement.textContent = String(finalScore);
  personalBestElement.textContent = String(personalBestScore);
  finalModeElement.textContent = finalMode;
}

// Person A's input.js sends this event when the game ends
document.addEventListener("sessionend", function (event) {
  populateResultsScreen(event.detail);
  showScreen(resultsScreen);
});

// Load personal best when the page opens
loadPersonalBest();