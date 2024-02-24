import fs from "fs";
import http from "http";
import * as ws from "ws";

import * as Game from "./js_modules/Game.mjs";

const port = 8080;

let socket_games = [];
let id_games = [];

const server = http.createServer(function (req, res){
	const url = req.url;
	const parsed_url = url.replace(/\?.*/gm, "");
	console.log(parsed_url);
	//svg
	if (/\.svg$/.test(parsed_url)){
		console.log("svg")
		//to test the url
		const url_files = ["/img/bishop.svg", "/img/king.svg", "/img/queen.svg", "/img/knight.svg",  "/img/rook.svg",  "/img/pawn.svg", "/img/send.svg", "/img/cross.svg"];
		//to get the path of the file
		const files = ["chess-bishop.svg", "chess-king.svg", "chess-queen.svg", "chess-knight.svg",  "chess-rook.svg",  "chess-pawn.svg", "send.svg", "cross.svg"];
		const path_files = files.map((file)=>"./public/img/"+file);
		const index = url_files.indexOf(parsed_url);
		if (index!==-1){
			console.log(path_files[index])
			fs.readFile(path_files[index],function(err, data){
				res.writeHead(200, {'Content-Type':'image/svg+xml'});
				res.write(data);
				res.end()
			})
			return
		}
	}
	switch (url.replace(/\?.*/gm, "")){
		case "/":
			fs.readFile("./public/html/index.html",function(err, data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.write(data);
				res.end()
			})
			return
		case "/game":
			fs.readFile("./public/html/game2.html",function(err, data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.write(data);
				res.end()
			})
			return
		case "/js/chess_ws.mjs":
			fs.readFile("./public/js/chess_ws.mjs",function(err, data){
				res.writeHead(200, {'Content-Type':'text/javascript'});
				res.write(data);
				res.end()
			})
			return
		case "/js/Board.mjs":
			fs.readFile("js_modules/Board.mjs",function(err, data){
				res.writeHead(200, {'Content-Type':'text/javascript'});
				res.write(data);
				res.end()
			})
			return
		case "/js/chessboard.mjs":
			fs.readFile("./public/js/chessboard.mjs",function(err, data){
				res.writeHead(200, {'Content-Type':'text/javascript'});
				res.write(data);
				res.end()
			})
			return
		case "/js/chess_html.mjs":
			fs.readFile("./public/js/chess_html.mjs",function(err, data){
				res.writeHead(200, {'Content-Type':'text/javascript'});
				res.write(data);
				res.end()
			})
			return
		case "/css/style.css":
			fs.readFile("./public/css/style.css",function(err, data){
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


const ws_server = new ws.WebSocketServer({
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
			const timer = 10 * 60 * 1000 //minutes * seconds * ms
			console.log();
			if (id_games[id]===undefined){
				console.log("player 1 create the game");
				let player = new Game.Player(socket, socket_id, timer);
				let game = new Game.Game(player, id);
				socket_games[socket_id] = game;
				id_games[game.id] = game;
			}else if (id_games[id].player_2===undefined){
				console.log("player 2 join the game");
				let game = id_games[id]
				let player = new Game.Player(socket, socket_id, timer);
				game.player_2 = player;
				socket_games[socket_id] = game;
				game.player_1.socket.send("S:1");
				game.player_2.socket.send("S:2");
				const check_timeout_id = setInterval(function (){
					const result = game.check_timeout(id_games, socket_games, sockets)
					if (result){
						sockets = result;
						clearInterval(check_timeout_id);
					}
				}, 1000);
			}else {
				socket.send("E:la partie est déjà complète");
			}
		}else{
			let game = socket_games[socket_id];
			if (game===undefined){socket.send("E:vous n'avez rejoint aucune partie");return}
			const player_turn = game.moves.length%2+1;
			if (game.player_2===undefined)socket.send("E:l'autre joueur n'as pas encore rejoint la partie");
			else if ((game.player_1.socket===socket && player_turn===1) || (game.player_2.socket===socket && player_turn===2)){
				const move = new Game.Move(msg, Date.now(), player_turn);
				const current_player = [game.player_1, game.player_2][player_turn-1];
				const result = game.play(msg);
				if (!result)return socket.send("E:Coup non valide");
				game.moves.push(move);
				//update the timer of the current player
				current_player.total_timestamp-= game.moves.length<=2 ? 0 : move.timestamp - game.moves.at(-2).timestamp;
				if (current_player.total_timestamp<=0){
					const winner = game.player_1===current_player ? game.player_2 : game.player_1;
					sockets = game.finish(winner, "time out", id_games, socket_games, sockets);
					return;
				}
				console.log(game.player_1.total_timestamp/1000);
				console.log(game.player_2.total_timestamp/1000);
				(current_player===game.player_1 ? game.player_2 : game.player_1).socket.send(msg);
				console.log("recieve: " + msg);
				if (msg[msg.length-1]==="#"){
					const winner = current_player;
					sockets = game.finish(winner, "checkmate", id_games, socket_games, sockets);
				}
			}else socket.send("E:C'est au tour de l'autre joueur");
		}
	});

	socket.on('close', function() {
		const game = socket_games[socket_id];
		if (!game)return;
		const winner = game.player_1.socket===socket ? game.player_2 : game.player_1;

		sockets = game.finish(winner, "the other player quit", id_games, socket_games, sockets);
		console.log("socket closed");
	});
});