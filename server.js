const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let currentPrice = 0;

async function fetchPrice() {
  try {
    const res = await axios.get(
      "https://api.coindesk.com/v1/bpi/currentprice/USD.json"
    );
    currentPrice = res.data.bpi.USD.rate_float;
    io.emit("priceUpdate", { price: currentPrice });
  } catch (err) {
    console.error("Error fetching BTC price", err.message);
  }
}
setInterval(fetchPrice, 5000);
fetchPrice();

io.on("connection", (socket) => {
  console.log("یک کاربر وصل شد:", socket.id);

  players[socket.id] = { coins: 0, prediction: null };
  socket.emit("welcome", { id: socket.id, players, price: currentPrice });

  socket.on("makePrediction", (data) => {
    players[socket.id].prediction = data.prediction;
    io.emit("predictionMade", {
      id: socket.id,
      prediction: data.prediction,
    });
  });

  socket.on("result", (data) => {
    let player = players[socket.id];
    if (!player) return;

    if (data.correct) {
      player.coins = player.coins === 0 ? 100 : player.coins * 2;
    } else {
      player.coins = 0;
    }
    io.emit("updateCoins", { id: socket.id, coins: player.coins });
  });

  socket.on("disconnect", () => {
    console.log("کاربر خارج شد:", socket.id);
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
