// const express = require("express");
// const http = require("http");
// const WebSocket = require("ws");
// const cors = require("cors");

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// const PORT = process.env.PORT || 4000;

// app.get("/", (req, res) => {
//     res.send("api socket");
// });

// let history = [Array(9).fill(null)];
// let xIsNext = true;
// let connectedPlayers = 0;

// app.use(cors());

// wss.on("connection", (ws) => {
//     console.log("A user connected");

//     if (connectedPlayers < 2) {
//         connectedPlayers++;
//         ws.player = connectedPlayers === 1 ? 'X' : 'O';
//         console.log(`Player ${ws.player} connected`);

//         ws.send(JSON.stringify({ type: "init", data: { history, xIsNext, player: ws.player } }));
//     } else {
//         console.log("Max players reached, disconnecting");
//         ws.close();
//     }

//     ws.on("message", (message) => {
//         console.log("Message received:", message);
//         // Handle incoming messages here
//     });

//     ws.on("close", () => {
//         console.log("User disconnected");
//         connectedPlayers--;
//     });
// });

// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 4000;

let history = [Array(9).fill(null)];
let xIsNext = true;
let connectedPlayers = 0;

app.use(cors());

io.on("connection", (socket) => {
    console.log("A user connected");

    if (connectedPlayers < 2) {
        connectedPlayers++;
        socket.player = connectedPlayers === 1 ? 'X' : 'O';
        console.log(`Player ${socket.player} connected`);

        socket.emit("init", { history, xIsNext, player: socket.player }); // Emitir el evento init solo al socket que se conectó
    } else {
        console.log("Max players reached, disconnecting");
        socket.disconnect();
    }

    socket.on("move", (i) => {
        console.log("Movimiento recibido desde el cliente:", i);
        const current = history[history.length - 1].slice();

        // Verificar si el movimiento es válido y si es el turno del jugador
        if (!calculateWinner(current) && !current[i] && ((xIsNext && socket.player === 'X') || (!xIsNext && socket.player === 'O'))) {
            current[i] = xIsNext ? 'X' : 'O';
            history.push(current); // Añadir el nuevo movimiento al historial
            xIsNext = !xIsNext; // Cambiar el turno del jugador
            io.emit("move", { history, xIsNext }); // Enviar el estado actualizado a todos los clientes
            const winner = calculateWinner(current);
            if (winner) {
                io.emit("winner", { winnerSquares: calculateWinnerSquares(current) });
            }
        }
        console.log(history, current)
    });


    socket.on("disconnect", () => {
        console.log("User disconnected");
        connectedPlayers--;
    });
});

function calculateWinnerSquares(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return [a, b, c];
        }
    }
    return null;
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});