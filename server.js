const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname));

const wss = new WebSocket.Server({ server });

const jogadores = new Map();

function enviarTodos(mensagem, excluir = null) {
    const texto = JSON.stringify(mensagem);

    wss.clients.forEach(cliente => {
        if (
            cliente !== excluir &&
            cliente.readyState === WebSocket.OPEN
        ) {
            cliente.send(texto);
        }
    });
}

function enviar(cliente, mensagem) {
    if (cliente.readyState === WebSocket.OPEN) {
        cliente.send(JSON.stringify(mensagem));
    }
}

wss.on("connection", socket => {

    console.log("Jogador conectado");

    let jogador = null;

    socket.on("message", mensagem => {

        let dados;

        try {
            dados = JSON.parse(mensagem.toString());
        } catch {
            return;
        }

        if (dados.type === "join") {

            jogador = {
                id: Math.random().toString(36).slice(2),
                name: String(dados.name || "Jogador").slice(0, 16),
                x: 0,
                y: 1.7,
                z: 0,
                yaw: 0,
                pitch: 0
            };

            jogadores.set(socket, jogador);

            const lista = Array.from(jogadores.values());

            enviar(socket, {
                type: "welcome",
                id: jogador.id,
                players: lista,
                count: lista.length
            });

            enviarTodos(
                {
                    type: "playerJoined",
                    player: jogador,
                    count: lista.length
                },
                socket
            );

            console.log(
                "Entrou:",
                jogador.name
            );

            return;
        }

        if (dados.type === "move" && jogador) {

            jogador.x = Number(dados.x) || 0;
            jogador.y = Number(dados.y) || 1.7;
            jogador.z = Number(dados.z) || 0;
            jogador.yaw = Number(dados.yaw) || 0;
            jogador.pitch = Number(dados.pitch) || 0;

            enviarTodos(
                {
                    type: "playerMoved",
                    id: jogador.id,
                    x: jogador.x,
                    y: jogador.y,
                    z: jogador.z,
                    yaw: jogador.yaw,
                    pitch: jogador.pitch
                },
                socket
            );
        }
    });

    socket.on("close", () => {

        if (!jogador) return;

        jogadores.delete(socket);

        const count = jogadores.size;

        enviarTodos({
            type: "playerLeft",
            id: jogador.id,
            count: count
        });

        console.log(
            "Saiu:",
            jogador.name
        );
    });

    socket.on("error", erro => {
        console.log("WebSocket:", erro.message);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Servidor funcionando na porta ${PORT}`
    );
});
