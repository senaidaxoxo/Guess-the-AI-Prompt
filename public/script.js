const ws = new WebSocket('ws://localhost:8080');

let currentPrompt = ""; // Store the current prompt for scoring
let score = 0; // Store the player's current score
let leaderboard = []; // Array to store player names and scores
let timer; 

// Start a 2-minute countdown
let timeRemaining = 120;

// WebSocket connection established
ws.onopen = () => {
  console.log('Connected to WebSocket server');
  startTimer(); // Start the countdown timer when WebSocket connects
  fetchNewImage(); // Fetch the first image on load
};

// Receive messages from the WebSocket server
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.imageURL) {
    console.log("Fetched image URL:", data.imageURL);

    document.getElementById('image').src = data.imageURL; // Display the new image
    currentPrompt = data.prompt; // Store the prompt for scoring
  } else if (data.points !== undefined) {
    updateScore(data.points); // Update score with points from server
  }
};

// Start the countdown timer
function startTimer() {
  timer = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--;
      updateTimerDisplay();
    } else {
      endGame(); // Trigger end game when timer reaches zero
    }
  }, 1000);
}

// Update the timer display on the page
function updateTimerDisplay() {
  const countdownElement = document.getElementById('countdown');
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  countdownElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Fetch a new image prompt from the server
function fetchNewImage() {
  ws.send('fetchImage');
}

// Submit the player's guess and check against the prompt
function submitGuess() {
  const guessInput = document.getElementById('guessInput');
  const guess = guessInput.value;
  guessInput.value = ""; // Clear input for next guess

  ws.send(`submitGuess:${guess}`);
  fetchNewImage(); // Get a new image after each guess
}

// Update score and display it
function updateScore(points) {
  score += points; // Add points to total score
  const scoreElement = document.getElementById('score');
  scoreElement.innerText = `Score: ${score}`;
}

// Rotate to the next image
function rotateImage() {
  fetchNewImage(); // Send a request for a new image from the server
}


// End game and display leaderboard after entering name
function endGame() {
    clearInterval(timer); // Stop the timer
  
    // Prompt for player's name
    const playerName = prompt("Game over! Enter your name for the leaderboard:");
    if (playerName) {
      leaderboard.push({ name: playerName, score: score });
      leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard by score
  
      // Display the leaderboard
      showLeaderboard();
    }
  }
  
  function showLeaderboard() {
    // Clear the body content and replace with leaderboard
    document.body.innerHTML = `
      <header><h1>Leaderboard</h1></header>
      <div class="leaderboard-container">
        <ul id="leaderboard"></ul>
        <button class="play-again-button" onclick="restartGame()">Play Again</button>
      </div>
      <footer>Created by Senaida Ng & Xiao Liang</footer>
    `;
  
    // Populate the leaderboard
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboard.forEach((entry, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${entry.name} - ${entry.score}`;
      leaderboardElement.appendChild(listItem);
    });
  }
  
  
  // Restart the game
  function restartGame() {
    location.reload(); // Reload the page to start a new game
  }
  
  // Add event listener to the "Submit" button
  document.getElementById('submitButton').addEventListener('click', submitGuess);
  
