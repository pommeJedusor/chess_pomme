import fs from "fs";
import http from "http";
import * as ws from "ws";

import * as Game from "./js_modules/Game.mjs";
import * as ws_chess from "./js_modules/ws.mjs";
import * as wstockfish from "./stockfish/wstockfish.mjs";
import * as ws_controller from "./js_modules/ws_controller.mjs";

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
		case "/js/chess_game/Board.mjs":
			fs.readFile("./js_modules/Board.mjs",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(res, 200, {'Content-Type':'text/javascript'}, data);
			})
			return
		case "/favicon.ico":
			fs.readFile("./public/img/apple.svg",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(res, 200, {'Content-Type':'image/svg+xml'}, data);
			})
			return
	}

	if (parameters.length>50)return return_http_error(400, res, "url too long");

	//get the extension of the file
	const file_name_extension = /\.([^.]+$)/.exec(parameters);
	if (!file_name_extension)return return_http_error(400, res, "unvalid url");
	const file_extension = file_name_extension[1];

	//check if valid format
	const char_authorized_check = /^[a-zA-Z0-9_./]+$/;
	if (!char_authorized_check.test(parameters))return return_http_error(400, res, "unvalid characters in the file_name");
	if (/\.\./.test(parameters))return return_http_error(400, res, "unvalid characters in the file_name");

	let headers;
	switch (file_extension){
		case "svg":
			headers = {'Content-Type':'image/svg+xml'};
			break;
		case "css":
			headers = {'Content-Type':'text/css'};
			break;
		case "mjs":
			headers = {'Content-Type':'text/javascript'};
			break;
		default:
			return return_http_error(404, res, "file not found");
	}
	const path = "./public/"+parameters;

	fs.readFile(path, function(err, data){
		if (err)return_http_error(404, res, "file not found");
		else return_http_result(res, 200, headers, data);
	});
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
let bot_id_games = [];

ws_server.on('connection', function(socket) {
	sockets.push(socket);
	const socket_id = Math.floor(Math.random()*1000000)
	let is_against_bot;
	let is_against_player;
	let bot_level;

	socket.on('message', function(msg) {
		msg = msg.toString();
		//init games
		//against player
		if (/^ID:/.test(msg)){
			if (is_against_bot || is_against_player){
				socket.send("vous ne pouvez pas rejoindre une partie avec la même ws que vous utiliser pour une autre game");
			}
			else {
				ws_chess.join_create_game(socket, socket_id, msg, id_games, socket_games, sockets);
				is_against_bot = false;
				is_against_player = true;
			}
			return;
		}
		//against stockfish
		else if (/^stockfish:/.test(msg)){
			if (is_against_bot || is_against_player){
				socket.send("vous ne pouvez pas rejoindre une partie avec la même ws que vous utiliser pour une autre game");
			}
			else {
				if (msg==="stockfish:")bot_level = 20;
				else bot_level = Number(msg.match(/^stockfish:(\d*)/)[1]);
				wstockfish.controller(sockets, socket_games, bot_id_games, socket, socket_id, msg);
				is_against_bot = true;
				is_against_player = false;
			}
			return;
		}
		//redirect to the controller needed
		if (is_against_player){
			ws_controller.ws_controller(sockets, socket_games, id_games, socket, socket_id, msg);
		}
		else if (is_against_bot){
			wstockfish.controller(sockets, socket_games, bot_id_games, socket, socket_id, msg, bot_level);
		}
	});
	socket.on("close", ()=>{
		if (is_against_player){
			ws_controller.close(sockets, socket_games, id_games, socket, socket_id);
		}
		else if (is_against_bot){
			wstockfish.close(sockets, socket_games, bot_id_games, socket, socket_id);
		}
	});
});