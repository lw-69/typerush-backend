let targetText = "";
let mode = "words";

const INITIAL_LIVES = 3;
const ERROR_THRESHOLD = 3;
const MULTIPLIER_THRESHOLDS = [
  { minStreak: 25, multiplier: 3 },
  { minStreak: 10, multiplier: 2 },
  { minStreak: 0, multiplier: 1 },
];
const DIFFICULTY_LEVELS = [
  {minWpm: 90, level: "Hard"},
  {minWpm: 60, level: "Medium"},
  {minWpm: 0, level: "Easy"},
];
let difficulty = "Easy";
let currentPosition = 0;
let startTime = null;
let wpmTimerId = null;
let lives = INITIAL_LIVES;
let errorsSinceLastLifeLoss = 0;
let sessionEnded = false;
let consecutiveCorrectWords = 0;
let multiplier = 1;
let peakMultiplier = 1;
let currentWordHasError = false;

const typedCharacters = []; //An array of all the typed characters

//Gets the references (IDs) of certain values in the HTML so that you can read and update them
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

    //Now that we have the text, paint it on the screen and initialize displays
    targetTextElement.textContent = targetText;
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

initGame();

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

  const correctCharacters = typedCharacters.filter((entry) => entry.isCorrect).length; //Filters characters by correctness

  return (correctCharacters / typedCharacters.length) * 100;
}

//Final score formula: WPM × accuracy% × peak multiplier reached during the session
//Example: WPM=60, accuracy=95%, peakMultiplier=2 → score = 60 × 0.95 × 2 = 114
function calculateFinalScore() {
  const wpm = calculateWpm();
  const accuracyPercent = calculateAccuracy();
  const accuracyRatio = accuracyPercent / 100;
  return Math.round(wpm * accuracyRatio * peakMultiplier);
}

//Returns the multiplier value for a given streak length, based on the configured thresholds
function multiplierForStreak(streak) {
  for (const tier of MULTIPLIER_THRESHOLDS) {
    if (streak >= tier.minStreak) {
      return tier.multiplier;
    }
  }
  return 1;
}

//Sets the wpm and accuracy on the browser to the correct values
function updateStatsDisplay() {
  const wpm = calculateWpm();
  const accuracy = calculateAccuracy();

  wpmElement.textContent = String(Math.round(wpm));
  accuracyElement.textContent = String(Math.round(accuracy));
}

function updateLivesDisplay() {
  livesElement.textContent = String(lives);
}

//Updates the multiplier display so Person B's UI can read it
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
  wpmTimerId = setInterval(updateStatsDisplay, 1000); //updates the display every second (every 1000 milliseconds)

  console.log("Session timer started:", startTime);
}

function difficultyLevel() {
  for (const tier of DIFFICULTY_LEVELS) {
    if (calculateWpm() >= tier.minWpm) {
      return tier.level;
    }
  }
  return "Easy";
}

function maybeUpgradeDifficulty() {
  if (mode !== "words") return; //only applies in word mode

  const newDifficulty = difficultyLevel();
  if (newDifficulty !== difficulty) {
    console.log(`Difficulty changed: ${difficulty} → ${newDifficulty}`);
    difficulty = newDifficulty;
  }
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

  //Build the session result object — this is what gets sent to the backend (Issue #16)
  //and rendered on the results screen by Person B
  const sessionResult = {
    wpm: Math.round(calculateWpm()),
    accuracy: Math.round(calculateAccuracy()),
    score: calculateFinalScore(),
    mode: mode,
    timestamp: new Date().toISOString(),
  };

  //Extra debug info — not part of the API contract, just useful for development
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

document.addEventListener("keydown", (event) => { //Makes the following function run every time a key is pressed
  
  //Ignore input after the session has ended
  if (sessionEnded) {
    return;
  }
  
  //Ignores clicks that are Tab, Enter or a non-character key
  if (event.key === "Tab" || event.key === "Enter") {
    event.preventDefault();
  }
  if (event.key.length !== 1) {
    return;
  }

  startTimerIfNeeded();

  //Stops accepting input if the user tries to write more characters than the length of the target text
  if (currentPosition >= targetText.length) {
    return;
  }

  const typedCharacter = event.key;
  const expectedCharacter = targetText[currentPosition];
  const isCorrect = typedCharacter === expectedCharacter;

  //Creates an object describing the keypress, stores information in the typedCharacters-array
  typedCharacters.push({
    position: currentPosition,
    typedCharacter,
    expectedCharacter,
    isCorrect,
  });

  //Lives system: count cumulative errors, deduct a life on threshold breach
  //Streak system: reset multiplier and streak on any error, mark current word as broken
  if (!isCorrect) {
    errorsSinceLastLifeLoss += 1;

    if (errorsSinceLastLifeLoss >= ERROR_THRESHOLD) {
      lives -= 1;
      errorsSinceLastLifeLoss = 0;
      console.log("Life lost. Lives remaining:", lives);
    }

    //Streak resets immediately on any error
    consecutiveCorrectWords = 0;
    multiplier = 1;
    currentWordHasError = true;
  }

  //Prints information to the console for debugging
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

  currentPosition += 1;

  const wordIsAtBoundary = expectedCharacter === " " || currentPosition >= targetText.length;

  if (wordIsAtBoundary) {
    if (!currentWordHasError) {
      consecutiveCorrectWords += 1;
      multiplier = multiplierForStreak(consecutiveCorrectWords);
      if (multiplier > peakMultiplier) {
        peakMultiplier = multiplier;
      }
      console.log(
        "Word completed correctly. Streak:", consecutiveCorrectWords,
        "Multiplier:", multiplier + "x",
        "Peak multiplier:", peakMultiplier + "x"
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
  maybeUpgradeDifficulty();
  
  //End session early if lives are gone, otherwise on full text completion
  if (lives <= 0) {
    endSession("out of lives");
    return;
  }
  if (currentPosition >= targetText.length) {
    endSession("text complete");
  }
});