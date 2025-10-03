const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

let rooms = {};

io.on("connection", socket => {
  console.log("connected:", socket.id);

  socket.on("joinRoom", ({ roomCode, playerName }) => {
    if (!rooms[roomCode]) rooms[roomCode] = { players: [], hiddenItem: null };
    rooms[roomCode].players.push({ id: socket.id, name: playerName });
    socket.join(roomCode);
    io.to(roomCode).emit("roomUpdate", rooms[roomCode].players);
  });

  socket.on("hideItem", ({ roomCode, item }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].hiddenItem = item;
      io.to(roomCode).emit("itemHidden", { by: socket.id, item });
    }
  });

  socket.on("findItem", ({ roomCode, item }) => {
    if (rooms[roomCode] && rooms[roomCode].hiddenItem === item) {
      io.to(roomCode).emit("winner", { id: socket.id, item });
    } else {
      socket.emit("notFound");
    }
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      rooms[code].players = rooms[code].players.filter(p => p.id !== socket.id);
      io.to(code).emit("roomUpdate", rooms[code].players);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("Server listening on port", PORT));