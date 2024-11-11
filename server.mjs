import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const wss = new WebSocketServer({ port: 8080 });
console.log('WebSocket server started on ws://localhost:5500');

// Arrays to store scraped images and user guesses
const images = [];
const guesses = [];

// Function to scrape random image and title from AI Scribbles
async function scrapeRandomImage() {
  try {
    const response = await fetch('https://www.aiscribbles.com/img/random/');
    if (!response.ok) throw new Error('Failed to fetch page from AI Scribbles');

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract image URL and ensure it has the full URL
    let imageUrl = $('div.col-12.col-md-7.col-lg-8.col-xl-9 img').attr('src');
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://www.aiscribbles.com${imageUrl}`;

    // Extract title text and clean it up
    const titleText = $('div.mt-3 div.my-2').text();
    const cleanedTitle = titleText ? titleText.replace('— Free Stock Image', '').trim() : 'Untitled';

    // Save the scraped image and title to the images array
    const imageData = { url: fullImageUrl, title: cleanedTitle };
    images.push(imageData);
    console.log(imageData);
    return imageData;
  } catch (error) {
    console.error('Error scraping image:', error);
    return null;
  }
}

// Utility function to calculate points based on guess similarity
function calculatePoints(guess, prompt) {
  const guessWords = guess.toLowerCase().split(' ');
  const promptWords = prompt.toLowerCase().split(' ');
  let points = 0;

  guessWords.forEach(word => {
    if (promptWords.includes(word)) points += 1;
  });

  return points;
}

// WebSocket handling for client requests
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    const [command, payload] = message.toString().split(':');

    if (command === 'fetchImage') {
      // Scrape a random image and send it to the client
      const imageData = await scrapeRandomImage();
      if (imageData) {
        ws.send(JSON.stringify({ imageURL: imageData.url, prompt: imageData.title }));
      } else {
        ws.send(JSON.stringify({ error: 'Could not retrieve image' }));
      }

    } else if (command === 'submitGuess') {
      // Handle the user's guess
      const guess = payload.trim();
      const lastImage = images[images.length - 1]; // Get the most recent image
      const points = calculatePoints(guess, lastImage.title);

      // Store the guess in the guesses array
      guesses.push({ guess, points });

      // Send points back to the client
      ws.send(JSON.stringify({ points }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
