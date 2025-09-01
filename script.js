let team = "";
let scores = [501, 501];
let turn = 0; // 0 = Player 1, 1 = Player 2
let usedPlayers = new Set();

const teamInput = document.getElementById("teamInput");
const startBtn = document.getElementById("startBtn");
const gameDiv = document.getElementById("game");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const turnDisplay = document.getElementById("turn");
const playerInput = document.getElementById("playerInput");
const throwBtn = document.getElementById("throwBtn");
const resetBtn = document.getElementById("resetBtn");
const message = document.getElementById("message");

// --- Start Game ---
startBtn.addEventListener("click", () => {
  team = teamInput.value.trim();
  if (!team) {
    alert("Please enter a team!");
    return;
  }
  document.getElementById("setup").style.display = "none";
  gameDiv.style.display = "block";
});

// --- Fetch player appearances from Wikipedia ---
async function getAppearances(player, team) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(player)}&prop=revisions&rvprop=content&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();

    const pages = data.query.pages;
    const page = pages[Object.keys(pages)[0]];
    if (!page.revisions) return null;

    const wikitext = page.revisions[0]["*"];

    // Regex to find appearances for specific team
    const regex = new RegExp(`\\|\\s*${team.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*?(\\d+)\\s*\\(`, "i");
    const match = wikitext.match(regex);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// --- Switch Turn ---
function switchTurn() {
  turn = 1 - turn;
  turnDisplay.textContent = `Player ${turn + 1}`;
}

// --- Apply Score Logic ---
function applyScore(playerName, apps) {
  let currentScore = scores[turn];

  // Bust: >180 appearances
  if (apps > 180) {
    message.textContent = `Bust! ${playerName} has ${apps} apps (>180).`;
    switchTurn();
    return;
  }

  // Winning rule: must match score or within +10
  if (apps >= currentScore && apps <= currentScore + 10) {
    scores[turn] = 0;
    if (turn === 0) score1.textContent = 0;
    else score2.textContent = 0;
    message.textContent = `🎉 Player ${turn + 1} wins with ${playerName} (${apps} apps)!`;
    throwBtn.disabled = true;
    playerInput.disabled = true;
    return;
  }

  // Normal scoring
  if (apps > currentScore) {
    message.textContent = `Bust! ${playerName}'s ${apps} apps exceed remaining score.`;
  } else {
    scores[turn] -= apps;
    if (turn === 0) score1.textContent = scores[0];
    else score2.textContent = scores[1];
    message.textContent = `Player ${turn + 1} chose ${playerName} (-${apps}).`;
  }

  switchTurn();
}

// --- Throw Action ---
throwBtn.addEventListener("click", async () => {
  const playerName = playerInput.value.trim();
  if (!playerName) return;

  if (usedPlayers.has(playerName)) {
    message.textContent = `${playerName} has already been used!`;
    return;
  }

  message.textContent = `Fetching appearances for ${playerName}...`;
  let apps = await getAppearances(playerName, team);

  // Fallback: ask manually if Wikipedia fails
  if (apps === null) {
    const manual = prompt(`Couldn't fetch appearances for ${playerName} at ${team}. Please enter manually:`);
    if (manual === null || isNaN(manual)) {
      message.textContent = "Invalid input. Try again.";
      return;
    }
    apps = parseInt(manual, 10);
  }

  usedPlayers.add(playerName);
  applyScore(playerName, apps);

  playerInput.value = "";
});

// --- Reset ---
resetBtn.addEventListener("click", () => {
  scores = [501, 501];
  turn = 0;
  usedPlayers.clear();
  score1.textContent = 501;
  score2.textContent = 501;
  message.textContent = "";
  throwBtn.disabled = false;
  playerInput.disabled = false;
  turnDisplay.textContent = "Player 1";
  document.getElementById("setup").style.display = "block";
  gameDiv.style.display = "none";
  teamInput.value = "";
});
