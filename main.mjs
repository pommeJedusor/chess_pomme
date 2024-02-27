import fs from "fs";
import http from "http";
import * as ws from "ws";

import * as Game from "./js_modules/Game.mjs";
import * as ws_chess from "./js_modules/ws.mjs";
import * as wstockfish from "./stockfish/wstockfish.mjs";

const port = 8080;

function return_http_error(error_code, res, status_message=null){
	if (status_message)res.writeHead(error_code, status_message);
	else res.writeHead(error_code);
	res.end();
}
function return_http_result(res, code, headers, data){
	res.writeHead(code, headers);
	res.write(data);
	res.end();
}
function get_waiting_games(number=10){
	let results = [];
	id_games.forEach((game, key)=>{
		if (game && game.player_1 && !game.player_2){
			results.push(key);
		}
		if (results.length>=number)return;
	});
	return results;
}

const server = http.createServer(function (req, res){
	const url = req.url;
	const parameters = url.replace(/\?.*/gm, "");

	switch (parameters){
		case "/":
			fs.readFile("./public/html/index.html",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(res, 200, {'Content-Type':'text/html'}, data);
			})
			return
		case "/stockfish":
		case "/game":
			fs.readFile("./public/html/game.html",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(res, 200, {'Content-Type':'text/html'}, data);
			})
			return
		case "/get_games":
			const games = get_waiting_games();
			return_http_result(res, 200, {'Content-Type':'json'}, JSON.stringify(games));
			return
		case "/js/Board.mjs":
			fs.readFile("./js_modules/Board.mjs",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(res, 200, {'Content-Type':'text/javascript'}, data);
			})
			return
	}

	if (parameters.length>30)return return_http_error(400, res, "url too long");

	const file_name_extension = /([^\/]*)\.([^.]+$)/.exec(parameters);
	if (!file_name_extension)return return_http_error(400, res, "unvalid url");
	const file_name = file_name_extension[1];
	const file_extension = file_name_extension[2];
	const file = file_name+"."+file_extension;

	//check if valid format
	const char_authorized_check = /^[a-zA-Z0-9_.]+$/;
	const extensions_authorized = ["svg" ,"mjs", "css"];
	if (!char_authorized_check.test(file))return return_http_error(400, res, "unvalid characters in the file_name");
	if (/\.\./.test(file))return return_http_error(400, res, "unvalid characters in the file_name");
	if (!extensions_authorized.includes(file_extension))return return_http_error(400, res, "extension of file not allowed");

	switch (file_extension){
		case "svg":
			const svg_path = "./public/img/"+file;
			const svg_headers = {'Content-Type':'image/svg+xml'};
			fs.readFile(svg_path, function(err, data){
				if (err)return_http_error(404, res, "svg not found");
				else return_http_result(res, 200, svg_headers, data);
			});
			return;
		case "css":
			const css_path = "./public/css/"+file;
			const css_headers = {'Content-Type':'text/css'};
			fs.readFile(css_path, function(err, data){
				if (err)return_http_error(404, res, "css not found");
				else return_http_result(res, 200, css_headers, data);
			});
			return;
		case "mjs":
			const mjs_path = "./public/js/"+file;
			const mjs_headers = {'Content-Type':'text/javascript'};
			fs.readFile(mjs_path, function(err, data){
				if (err)return_http_error(404, res, "mjs not found");
				else return_http_result(res, 200, mjs_headers, data);
			});
			return;
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
let socket_games = [];
let id_games = [];

ws_server.on('connection', function(socket) {
	sockets.push(socket);
	const socket_id = Math.floor(Math.random()*1000000)

	socket.on('message', function(msg) {
		msg = msg.toString();
		if (/^ID:/.test(msg)){
			ws_chess.join_create_game(socket, socket_id, msg, id_games, socket_games, sockets);
		}
		else if (/^stockfish:/.test(msg)){
			wstockfish.controller(sockets, socket_games, id_games, socket, socket_id, msg.substring(10));
		}
		else if (!socket_games[socket_id]){
			socket.send("E:Vous n'êtes dans une partie");
			return;
		}
		//draw (proposal, decline or accept)
		else if (/^D/.test(msg)){
			ws_chess.draws(socket, socket_id, msg, id_games, socket_games, sockets);
		}
		//messages
		else if (/^M:/.test(msg)){
			let game = socket_games[socket_id];
			if (!game.player_2){
				socket.send("E:l'autre joueur n'as pas encore rejoint");
				return;
			}
			if (!/^M:[A-Za-z0-9éèùûôîà'"\-_() ]+\|[A-Za-z0-9éèùûôîà'"\-_() ]+$/.test(msg)){
				socket.send("E:message non valide");
				return
			}
			game.player_1.socket.send(msg);
			if (game.player_2)game.player_2.socket.send(msg);
		}
		//resign
		else if (/^R:/.test(msg)){
			let game = socket_games[socket_id];
			if (!game.player_2){
				socket.send("E:l'autre joueur n'as pas encore rejoint");
				return;
			}
			const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
			sockets = game.finish(other_player, "par abandon", id_games, socket_games, sockets);
		}
		else{
			let game = socket_games[socket_id];
			if (game===undefined){socket.send("E:vous n'avez rejoint aucune partie");return}
			const player_turn = game.moves.length%2+1;
			if (game.player_2===undefined)socket.send("E:l'autre joueur n'as pas encore rejoint la partie");
			else if ((game.player_1.socket===socket && player_turn===1) || (game.player_2.socket===socket && player_turn===2)){
				const move = new Game.Move(msg, Date.now(), player_turn);
				const current_player = [game.player_1, game.player_2][player_turn-1];
				const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
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
				(current_player===game.player_1 ? game.player_2 : game.player_1).socket.send(msg);
				if (msg[msg.length-1]==="#"){
					const winner = current_player;
					sockets = game.finish(winner, "par mat", id_games, socket_games, sockets);
				}
				if (game.board.get_every_moves().length===0){
					sockets = game.finish(null, "par pat", id_games, socket_games, sockets);
				}
				other_player.draw_proposal = false;//reset draw proposal
			}else socket.send("E:C'est au tour de l'autre joueur");
		}
	});

	socket.on('close', function() {
		const game = socket_games[socket_id];
		if (!game)return;
		const winner = game.player_1.socket===socket ? game.player_2 : game.player_1;

		sockets = game.finish(winner, "the other player quit", id_games, socket_games, sockets);
	});
});