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

// Play again -> switch back to game screen
playAgainBtn.addEventListener("click", function () {
  showScreen(gameScreen);
});

// Back to menu -> return to main menu
backMenuBtn.addEventListener("click", function () {
  showScreen(menuScreen);
});