const targetText = "hello world"; //The text that is supposed to be written by the user
const INITIAL_LIVES = 3;
const ERROR_THRESHOLD = 3;
const MODE = "words";
const MULTIPLIER_THRESHOLDS = [
  { minStreak: 25, multiplier: 3 },
  { minStreak: 10, multiplier: 2 },
  { minStreak: 0, multiplier: 1 },
];
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

// Clear existing text inside the target text container
targetTextElement.innerHTML = "";

// Loop through every character in the target text
for (let i = 0; i < targetText.length; i++) {

  // Create a new <span> element for each character
  const characterSpan = document.createElement("span");

  // Put the current character inside the span
  characterSpan.textContent = targetText[i];

  // Add a general class for all characters
  characterSpan.classList.add("character");

  // Highlight the very first character as the current typing position
  if (i === 0) {
    characterSpan.classList.add("current");
  }

  // Add the span to the page
  targetTextElement.appendChild(characterSpan);
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

function startTimerIfNeeded() {
  if (startTime !== null) {
    return;
  }

  startTime = Date.now();
  wpmTimerId = setInterval(updateStatsDisplay, 1000); //updates the display every second (every 1000 milliseconds)

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

  //Build the session result object — this is what gets sent to the backend (Issue #16)
  //and rendered on the results screen by Person B
  const sessionResult = {
    wpm: Math.round(calculateWpm()),
    accuracy: Math.round(calculateAccuracy()),
    score: calculateFinalScore(),
    mode: MODE,
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

  // Check if the current character finishes a word.
  // A word is finished when the expected character is a space,
  // or when the player reaches the last character in the text.
  const isAtWordBoundary =
    expectedCharacter === " " || currentPosition === targetText.length - 1;

  // This code updates the visual feedback after the player types one character
  // Get all character spans from the page
  const characterSpans = document.querySelectorAll(".character");

  // Remove the "current" highlight from the current character
  characterSpans[currentPosition].classList.remove("current");

  // If the typed character is correct → make it green
  if (isCorrect) {
    characterSpans[currentPosition].classList.add("correct");
  } else {

    // Otherwise make it red
    characterSpans[currentPosition].classList.add("incorrect");
  }

  // Move the cursor highlight to the next character
  if (currentPosition + 1 < characterSpans.length) {
    characterSpans[currentPosition + 1].classList.add("current");
  }

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

  if (isAtWordBoundary) {
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

  //End session early if lives are gone, otherwise on full text completion
  if (lives <= 0) {
    endSession("out of lives");
    return;
  }
  if (currentPosition >= targetText.length) {
    endSession("text complete");
  }
});

updateStatsDisplay();
updateLivesDisplay();
updateMultiplierDisplay();