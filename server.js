const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const jogadores = {};

io.on("connection", (socket) => {
  console.log("Jogador conectado:", socket.id);

  jogadores[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    z: 0
  };

  socket.emit("estadoInicial", jogadores);
  socket.broadcast.emit("jogadorEntrou", jogadores[socket.id]);

  socket.on("movimento", (dados) => {
    if (!jogadores[socket.id]) return;

    jogadores[socket.id].x = dados.x;
    jogadores[socket.id].y = dados.y;
    jogadores[socket.id].z = dados.z;

    socket.broadcast.emit("movimentoJogador", jogadores[socket.id]);
  });

  socket.on("disconnect", () => {
    delete jogadores[socket.id];
    io.emit("jogadorSaiu", socket.id);
    console.log("Jogador saiu:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor funcionando na porta ${PORT}`);
});