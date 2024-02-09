const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const Game = require("./Game");

const port = 8080;

let socket_games = [];
let id_games = [];

const server = http.createServer(function (req, res){
	const url = req.url;
	console.log(url.replace(/\?.*/gm, ""));
	switch (url.replace(/\?.*/gm, "")){
		case "/":
			fs.readFile("./html/index.html",function(err, data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.write(data);
				res.end()
			})
			return
		case "/game":
			fs.readFile("./html/game.html",function(err, data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.write(data);
				res.end()
			})
			return
		case "/js/chess.js":
			fs.readFile("./js/chess.js",function(err, data){
				res.writeHead(200, {'Content-Type':'text/javascript'});
				res.write(data);
				res.end()
			})
			return
		case "/css/style.css":
			fs.readFile("./css/style.css",function(err, data){
				res.writeHead(200, {'Content-Type':'text/css'});
				res.write(data);
				res.end()
			})
			return
		default:
			res.writeHead(404);
			res.end();
			return
	}
})

server.listen(port, function(error){
	if (error) {
		console.log(error);
	}else {
		console.log("server is listening on port: " + port);
	}
})


const ws_server = new WebSocket.Server({
	port: 3000
});

let sockets = [];
ws_server.on('connection', function(socket) {
	sockets.push(socket);
	const socket_id = Math.floor(Math.random()*1000000)

	socket.on('message', function(msg) {
		msg = msg.toString();
		console.log("socket id: "+socket_id);
		if (/ID:\d*$/.test(msg)){
			const id = msg.match(/(?<=ID:)\d*$/)[0];
			console.log();
			if (id_games[id]===undefined){
				console.log("player 1 create the game");
				let game = new Game.Game(socket, id);
				socket_games[socket_id] = game;
				id_games[game.id] = game;
			}else if (id_games[id].player_2===undefined){
				console.log("player 2 join the game");
				let game = id_games[id]
				game.player_2 = socket;
				socket_games[socket_id] = game;
			}else {
				socket.send("E:la partie est déjà complète");
			}
		}else{
			let game = socket_games[socket_id];
			if (game===undefined)socket.send("E:vous n'avez rejoint aucune partie");
			else if (game.player_2===undefined)socket.send("E:l'autre joueur n'as pas encore rejoint la partie");
			else if ((game.player_1===socket && game.moves.length%2==0) || (game.player_2===socket && game.moves.length%2==1)){
				game.moves.push(msg);
				game.player_1.send(msg);
				game.player_2.send(msg);
				console.log("recieve: " + msg);
				if (msg[msg.length-1]==="#"){
					socket_games[game.player_1] = undefined;
					socket_games[game.player_2] = undefined;
					id_games[game.id] = undefined;
				}
			}else socket.send("E:C'est au tour de l'autre joueur");
		}
	});

	socket.on('close', function() {
		console.log("socket closed");
		sockets = sockets.filter(s => s !== socket);
	});
});