let targetText = "";
let mode = "words";
const DIFFICULTY_SETTINGS = {
  easy: {
    errorThreshold: 15,
    multiplierThresholds: [
      { minStreak: 15, multiplier: 3 },
      { minStreak: 5,  multiplier: 2 },
      { minStreak: 0,  multiplier: 1 },
    ],
  },
  medium: {
    errorThreshold: 3,
    multiplierThresholds: [
      { minStreak: 25, multiplier: 3 },
      { minStreak: 10, multiplier: 2 },
      { minStreak: 0,  multiplier: 1 },
    ],
  },
  hard: {
    errorThreshold: 1,
    multiplierThresholds: [
      { minStreak: 40, multiplier: 3 },
      { minStreak: 20, multiplier: 2 },
      { minStreak: 0,  multiplier: 1 },
    ],
  },
};
const INITIAL_LIVES = 3;
//These are set when the session starts based on `difficulty`
let difficulty = "medium";
let errorThreshold = DIFFICULTY_SETTINGS[difficulty].errorThreshold;
let multiplierThresholds = DIFFICULTY_SETTINGS[difficulty].multiplierThresholds;

let currentPosition = 0;
let startTime = null;
let wpmTimerId = null;
let lives = INITIAL_LIVES;
let previousLives = INITIAL_LIVES; 
let errorsSinceLastLifeLoss = 0;
let sessionEnded = false;
let consecutiveCorrectWords = 0;
let multiplier = 1;
let peakMultiplier = 1;
let currentWordHasError = false;

const typedCharacters = []; // An array of all typed characters

// Gets references to HTML elements so JavaScript can read and update them
const targetTextElement = document.getElementById("target-text");
const currentPositionElement = document.getElementById("current-position");
const statusElement = document.getElementById("status");
const wpmElement = document.getElementById("wpm");
const accuracyElement = document.getElementById("accuracy");
const livesElement = document.getElementById("lives");
const multiplierElement = document.getElementById("multiplier");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");

//Fetches content for the current mode from Person C's backend and starts the game.
//The mode determines which endpoint we call: /content/words, /content/sentences, /content/code
async function initGame() {
  try {
    const response = await fetch(`https://typerush-5imc.onrender.com/content/${mode}`);
    const data = await response.json();

    //Adjust based on Person C's actual response shape
    targetText = data.content.join(" ");

    // Clear the target text container before adding the text
    targetTextElement.innerHTML = "";

    // Render the target text as individual <span> elements.
    // This allows each character to be styled separately as correct, incorrect, or current.
    for (let i = 0; i < targetText.length; i++) {
      const characterSpan = document.createElement("span");
      characterSpan.textContent = targetText[i];
      characterSpan.classList.add("character");

      // Highlight the first character as the starting cursor position
      if (i === 0) {
        characterSpan.classList.add("current");
      }

      targetTextElement.appendChild(characterSpan);
    }

    //Initialize displays now that the text is on screen
    updateStatsDisplay();
    updateLivesDisplay();
    updateMultiplierDisplay();
    updateScoreDisplay();

    console.log("Game initialized. Mode:", mode, "Text:", targetText);
  } catch (error) {
    console.error("Failed to fetch content from backend:", error);
    targetTextElement.textContent = "Failed to load content. Please refresh.";
  }
}

//Called by Person B's menu when the user picks a difficulty and starts a session
function startGame(selectedDifficulty) {
  if (!DIFFICULTY_SETTINGS[selectedDifficulty]) {
    console.warn(`Unknown difficulty "${selectedDifficulty}", defaulting to medium`);
    selectedDifficulty = "medium";
  }

  difficulty = selectedDifficulty;
  errorThreshold = DIFFICULTY_SETTINGS[difficulty].errorThreshold;
  multiplierThresholds = DIFFICULTY_SETTINGS[difficulty].multiplierThresholds;

  console.log(`Game starting on ${difficulty} difficulty. errorThreshold=${errorThreshold}`);

  initGame();
}

async function saveSession(sessionResult) {
  try {
    const response = await fetch(
      "https://typerush-5imc.onrender.com/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionResult),
      }
    );

const data = await response.json();

    console.log("Saved:", data);

  } catch (error) {
    console.error("Error saving session:", error);
  }
}

function calculateMinutesElapsed() {
  if (startTime === null) {
    return 0;
  }

  return (Date.now() - startTime) / 1000 / 60;
}

function calculateWpm() {
  const minutesElapsed = calculateMinutesElapsed();

  if (minutesElapsed === 0) {
    return 0;
  }

  return (typedCharacters.length / 5) / minutesElapsed;
}

function calculateAccuracy() {
  if (typedCharacters.length === 0) {
    return 100;
  }

  const correctCharacters = typedCharacters.filter((entry) => entry.isCorrect).length;

  return (correctCharacters / typedCharacters.length) * 100;
}

// Final score formula: WPM × accuracy% × peak multiplier reached during the session
function calculateFinalScore() {
  const wpm = calculateWpm();
  const accuracyPercent = calculateAccuracy();
  const accuracyRatio = accuracyPercent / 100;

  return Math.round(wpm * accuracyRatio * peakMultiplier);
}

// Returns the multiplier value for a given streak length
function multiplierForStreak(streak) {
  for (const tier of multiplierThresholds) {
    if (streak >= tier.minStreak) {
      return tier.multiplier;
    }
  }

  return 1;
}

// Updates the WPM and accuracy numbers shown on the game screen.
// WPM is shown as a whole number.
// Accuracy is shown as a percentage with 1 decimal place.
function updateStatsDisplay() {
  const wpm = calculateWpm();
  const accuracy = calculateAccuracy();

  wpmElement.textContent = String(Math.round(wpm));
  accuracyElement.textContent = accuracy.toFixed(1) + "%";
}

// Updates the lives display using heart icons.
// Only the remaining lives are shown as full hearts.
// Used AI here!
function updateLivesDisplay() {
  const fullHeart = "❤️";

  livesElement.textContent = fullHeart.repeat(lives);

  // If the current lives are lower than before, play the life lost animation.
  if (lives < previousLives) {
    livesElement.classList.add("life-lost");

    // Remove the animation class after it finishes,
    // so it can run again next time a life is lost.
    setTimeout(function () {
      livesElement.classList.remove("life-lost");
    }, 250);
  }

  previousLives = lives;
}

// Updates the multiplier display so the UI can show the current streak multiplier
function updateMultiplierDisplay() {
  multiplierElement.textContent = String(multiplier) + "x";
}

function updateScoreDisplay() {
  scoreElement.textContent = calculateFinalScore();
}

function startTimerIfNeeded() {
  if (startTime !== null) {
    return;
  }

  startTime = Date.now();

  // Updates the WPM and accuracy display every second
  wpmTimerId = setInterval(updateStatsDisplay, 1000);

  console.log("Session timer started:", startTime);
}

function endSession(reason) {
  if (sessionEnded) {
    return;
  }

  sessionEnded = true;

  if (wpmTimerId !== null) {
    clearInterval(wpmTimerId);
    wpmTimerId = null;
  }

  // Build the session result object.
  // Person B uses this for the results screen.
  // Person C can use this for saving the session to the backend.
  const sessionResult = {
    wpm: Math.round(calculateWpm()),
    accuracy: Math.round(calculateAccuracy()),
    score: calculateFinalScore(),
    mode: mode,
    difficulty: difficulty,
    timestamp: new Date().toISOString(),
  };

  const debugSummary = {
    ...sessionResult,
    reason,
    lives,
    charactersTyped: typedCharacters.length,
    peakMultiplier,
    finalMultiplier: multiplier,
    consecutiveCorrectWords,
  };

  console.log("Session ended:", debugSummary);

  saveSession(sessionResult);

  //Person B (results screen) and Person C (API call) both listen for this event

  document.dispatchEvent(new CustomEvent("sessionend", { detail: sessionResult }));
}

document.addEventListener("keydown", (event) => {
  // Ignore input after the session has ended
  if (sessionEnded) {
    return;
  }

  // Prevent Tab and Enter from interfering with the game
  if (event.key === "Tab" || event.key === "Enter") {
    event.preventDefault();
  }

  // Ignore non-character keys like Shift, Control, ArrowLeft, etc.
  if (event.key.length !== 1) {
    return;
  }

  startTimerIfNeeded();

  // Stop accepting input if the user already reached the end of the target text
  if (currentPosition >= targetText.length) {
    return;
  }

  const typedCharacter = event.key;
  const expectedCharacter = targetText[currentPosition];
  const isCorrect = typedCharacter === expectedCharacter;

// Get all character spans from the page
  const characterSpans = document.querySelectorAll(".character");

  // Remove the current-character highlight from the character being typed
  characterSpans[currentPosition].classList.remove("current");

  // Add green/red visual feedback depending on whether the typed character is correct
  if (isCorrect) {
    characterSpans[currentPosition].classList.add("correct");
  } else {
    characterSpans[currentPosition].classList.add("incorrect");
  }

  // Store information about this keypress
  typedCharacters.push({
    position: currentPosition,
    typedCharacter,
    expectedCharacter,
    isCorrect,
  });

  // Lives system: count errors and deduct a life when the error threshold is reached.
  // Streak system: reset multiplier and streak on any error.
  if (!isCorrect) {
    errorsSinceLastLifeLoss += 1;

    if (errorsSinceLastLifeLoss >= errorThreshold) {
      lives -= 1;
      errorsSinceLastLifeLoss = 0;
      console.log("Life lost. Lives remaining:", lives);
    }

    consecutiveCorrectWords = 0;
    multiplier = 1;
    currentWordHasError = true;
  }

  console.log({
    position: currentPosition,
    typedCharacter,
    expectedCharacter,
    isCorrect,
    wpm: calculateWpm(),
    accuracy: calculateAccuracy(),
    lives,
    errorsSinceLastLifeLoss,
    consecutiveCorrectWords,
    multiplier,
    peakMultiplier,
  });

  // Move to the next character
  currentPosition += 1;

  // Check if a word was just completed (space in target, or end of text)
  const isAtWordBoundary = expectedCharacter === " " || currentPosition >= targetText.length;

  // Move the current-character highlight to the next character
  if (currentPosition < characterSpans.length) {
    characterSpans[currentPosition].classList.add("current");
  }

  // If a word was completed, update streak and multiplier
  if (isAtWordBoundary) {
    if (!currentWordHasError) {
      consecutiveCorrectWords += 1;
      multiplier = multiplierForStreak(consecutiveCorrectWords);

      if (multiplier > peakMultiplier) {
        peakMultiplier = multiplier;
      }

      console.log(
        "Word completed correctly. Streak:",
        consecutiveCorrectWords,
        "Multiplier:",
        multiplier + "x",
        "Peak multiplier:",
        peakMultiplier + "x"
      );
    } else {
      console.log("Word completed with errors. Streak stays at 0.");
    }

    currentWordHasError = false;
  }

  currentPositionElement.textContent = String(currentPosition);
  statusElement.textContent = isCorrect ? "Correct" : "Incorrect";

  updateLivesDisplay();
  updateMultiplierDisplay();
  updateStatsDisplay();

  updateScoreDisplay();
  
  //End session early if lives are gone, otherwise on full text completion

  if (lives <= 0) {
    endSession("out of lives");
    return;
  }

  if (currentPosition >= targetText.length) {
    endSession("text complete");
  }
});
//startGame("medium");