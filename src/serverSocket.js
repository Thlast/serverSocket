const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
    res.send("api socket");
});

let history = [Array(9).fill(null)];
let xIsNext = true;
let connectedPlayers = 0;

app.use(cors());

wss.on("connection", (ws) => {
    console.log("A user connected");

    if (connectedPlayers < 2) {
        connectedPlayers++;
        ws.player = connectedPlayers === 1 ? 'X' : 'O';
        console.log(`Player ${ws.player} connected`);

        ws.send(JSON.stringify({ type: "init", data: { history, xIsNext, player: ws.player } }));
    } else {
        console.log("Max players reached, disconnecting");
        ws.close();
    }

    ws.on("message", (message) => {
        console.log("Message received:", message);
        // Handle incoming messages here
    });

    ws.on("close", () => {
        console.log("User disconnected");
        connectedPlayers--;
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
