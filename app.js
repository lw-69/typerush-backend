const targetText = "hello world";
let currentPosition = 0;
let startTime = null;
let wpmTimerId = null;

const typedCharacters = [];

const targetTextElement = document.getElementById("target-text");
const currentPositionElement = document.getElementById("current-position");
const statusElement = document.getElementById("status");
const wpmElement = document.getElementById("wpm");
const accuracyElement = document.getElementById("accuracy");

targetTextElement.textContent = targetText;

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

function updateStatsDisplay() {
  const wpm = calculateWpm();
  const accuracy = calculateAccuracy();

  wpmElement.textContent = String(Math.round(wpm));
  accuracyElement.textContent = String(Math.round(accuracy));
}

function startTimerIfNeeded() {
  if (startTime !== null) {
    return;
  }

  startTime = Date.now();
  wpmTimerId = setInterval(updateStatsDisplay, 1000);

  console.log("Session timer started:", startTime);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" || event.key === "Enter") {
    event.preventDefault();
  }

  if (event.key.length !== 1) {
    return;
  }

  startTimerIfNeeded();

  if (currentPosition >= targetText.length) {
    console.log("Session complete");
    return;
  }

  const typedCharacter = event.key;
  const expectedCharacter = targetText[currentPosition];
  const isCorrect = typedCharacter === expectedCharacter;

  typedCharacters.push({
    position: currentPosition,
    typedCharacter,
    expectedCharacter,
    isCorrect,
  });

  console.log({
    position: currentPosition,
    typedCharacter,
    expectedCharacter,
    isCorrect,
    wpm: calculateWpm(),
    accuracy: calculateAccuracy(),
  });

  currentPosition += 1;

  currentPositionElement.textContent = String(currentPosition);
  statusElement.textContent = isCorrect ? "Correct" : "Incorrect";

  updateStatsDisplay();

  if (currentPosition >= targetText.length && wpmTimerId !== null) {
    clearInterval(wpmTimerId);
    wpmTimerId = null;
    console.log("Session complete");
  }
});

updateStatsDisplay();