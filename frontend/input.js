const targetText = "hello world"; //The text that is supposed to be written by the user
const INITIAL_LIVES = 3;
const ERROR_THRESHOLD = 3;
let currentPosition = 0;
let startTime = null;
let wpmTimerId = null;
let lives = INITIAL_LIVES;
let errorsSinceLastLifeLoss = 0;
let sessionEnded = false;

const typedCharacters = []; //An array of all the typed characters

//Gets the references (IDs) of certain values in the HTML so that you can read and update them
const targetTextElement = document.getElementById("target-text");
const currentPositionElement = document.getElementById("current-position");
const statusElement = document.getElementById("status");
const wpmElement = document.getElementById("wpm");
const accuracyElement = document.getElementById("accuracy");
const livesElement = document.getElementById("lives");

targetTextElement.textContent = targetText; //The text that will be displayed on the browser

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

  const summary = {
    reason, //"text complete" | "out of lives"
    wpm: calculateWpm(),
    accuracy: calculateAccuracy(),
    lives,
    charactersTyped: typedCharacters.length,
  };

  console.log("Session ended:", summary);

  document.dispatchEvent(new CustomEvent("sessionend", { detail: summary }));
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

  if (!isCorrect) {
    errorsSinceLastLifeLoss += 1;

  if (errorsSinceLastLifeLoss >= ERROR_THRESHOLD) {
      lives -= 1;
      errorsSinceLastLifeLoss = 0;
      console.log("Life lost. Lives remaining:", lives);
    }
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
  });

  currentPosition += 1;

  currentPositionElement.textContent = String(currentPosition);
  statusElement.textContent = isCorrect ? "Correct" : "Incorrect";

  updateLivesDisplay();
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