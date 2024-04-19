const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get("/", (req, res) => {
    res.send("api socket");
});

const PORT = process.env.PORT || 4000;

let history = [Array(9).fill(null)];
let xIsNext = true;
let connectedPlayers = 0;
let players = [];
let playerMoves = {
    'X': [],
    'O': []
};
let chatMessages = [];

app.use(cors());

io.on("connection", (socket) => {
    console.log("A user connected");

    
    if (connectedPlayers >= 2) {
        console.log("Max players reached, disconnecting");
        socket.disconnect();
        return;
    }
    
    connectedPlayers++;
    let playerType = connectedPlayers === 1 ? 'X' : 'O';
    if (connectedPlayers === 2 && players.length > 0 && players[0].player === playerType) {
        playerType = playerType === 'X' ? 'O' : 'X';
    }
    socket.player = playerType;
    console.log(`Player ${socket.player} connected`);
    
    players.push({ id: socket.id, player: playerType });
    
    socket.emit("init", { history, xIsNext, player: socket.player });
    


    ////CHAT
    socket.on("mensaje", (mensaje) => {
        console.log("Mensaje recibido:", mensaje);
        chatMessages.push({ jugador: socket.player, mensaje });
        io.emit("mensaje", { jugador: socket.player, mensaje });
    });
    

    ////MOVIMIENTOS Y JUEGO
    socket.on("move", (i) => {
        console.log("Movimiento recibido desde el cliente:", i);
        const current = [...history[history.length - 1]]; // Clonar el último tablero
    
        if (!calculateWinner(current) && ((xIsNext && socket.player === 'X') || (!xIsNext && socket.player === 'O'))) {
    
            // Almacena el movimiento del jugador
            playerMoves[socket.player].push(i);
            if (playerMoves[socket.player].length > 3) {
                const moveToRemove = playerMoves[socket.player].shift(); // Eliminar el último movimiento del historial
                current[moveToRemove] = null; // Eliminar el último movimiento del tablero actual
            }
            current[i] = xIsNext ? 'X' : 'O';
            xIsNext = !xIsNext;
    
            // Actualizar el historial con el último tablero
            history[history.length - 1] = current;
    
            // Envía los historiales actualizados después de cada movimiento
            io.emit("move", { history, xIsNext, playerMoves });
    
            const winner = calculateWinner(current);
            if (winner) {
                io.emit("winner", { winner, winnerSquares: calculateWinnerSquares(current) });
    
                setTimeout(() => {
                    console.log("Restarting the game");
                    history = [Array(9).fill(null)];
                    xIsNext = true;
                    playerMoves['X'] = [];
                    playerMoves['O'] = [];
                    io.emit("gameRestarted", { history, xIsNext, playerMoves });
                }, 5000);
            }
        }
    });
    


    socket.on("restart", () => {
        console.log("Restarting the game");
        history = [Array(9).fill(null)];
        xIsNext = true;
        playerMoves['X'] = [];
        playerMoves['O'] = [];
        io.emit("gameRestarted", { history, xIsNext, playerMoves });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
        connectedPlayers--;
        players = players.filter(p => p.id !== socket.id);
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
