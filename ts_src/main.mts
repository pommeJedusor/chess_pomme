import fs from "fs";
import http from "http";
import * as ws from "ws";
import * as ejs from "ejs";

import * as ws_chess from "./js_modules/ws.mjs";
import * as wstockfish from "./stockfish/wstockfish.mjs";
import * as ws_controller from "./js_modules/ws_controller.mjs";
import * as Game from "./model/Game.mjs";

const port:number = 8080;

function return_http_error(error_code:number, res:http.ServerResponse<http.IncomingMessage>, status_message:string|undefined):void{
	res.writeHead(error_code, status_message);
	res.end();
}
function return_http_result(code:number, res:http.ServerResponse<http.IncomingMessage>, headers:http.OutgoingHttpHeaders, data:string|Buffer):void{
	res.writeHead(code, headers);
	res.write(data);
	res.end();
}
function get_waiting_games(number:number=10):(number|string)[][]{
	let results:number[] = [];
	id_games.forEach((game:any, key:number)=>{
		if (game && game.player_1 && !game.player_2){
			console.log(id_games[key].player_1.total_timestamp)
			results.push(key);
		}
		if (results.length>=number)return;
	});
	const seconds_from_timestamp = (timestamp:number)=>(timestamp/1000)%60;
	const minutes_from_timestamp = (timestamp:number)=>(timestamp/60000);
	return results.map((id:number)=>[
        id,
        `./game?id_game=${id}&minutes=${minutes_from_timestamp(id_games[id].player_1.total_timestamp)}&seconds=${seconds_from_timestamp(id_games[id].player_1.total_timestamp)}`
    ]);
}

const server = http.createServer(function (req, res){
	const url:string = req.url || "";
	const parameters:string = url.replace(/\?.*/gm, "");

	switch (parameters){
		case "/":
			async function send_response_home(){
				const old_games:Game.Game[] = await Game.get_all_games(5);
				const htmlContent:string = fs.readFileSync('./views/home.ejs', 'utf8');
				const htmlRenderized:string = ejs.render(htmlContent, {filename: 'home.ejs', games: old_games});
				return_http_result(200, res, {'Content-Type':'text/html'}, htmlRenderized);
			}
			send_response_home();
			return
		case "/stockfish":
		case "/game":
			fs.readFile("./public/html/game.html",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(200, res, {'Content-Type':'text/html'}, data);
			})
			return
		case "/get_games":
			const games:(string|number)[][] = get_waiting_games();
			return_http_result(200, res, {'Content-Type':'json'}, JSON.stringify(games));
			return
		case "/old_games":
			async function send_response(){
				const old_games:Game.Game[] = await Game.get_all_games();
				const htmlContent:string = fs.readFileSync('./views/old_games.ejs', 'utf8');
				const htmlRenderized:string = ejs.render(htmlContent, {filename: 'old_games.ejs', games: old_games});
				return_http_result(200, res, {'Content-Type':'text/html'}, htmlRenderized);
			}
			send_response();
			return
		case "/js/chess_game/Board.mjs":
			fs.readFile("./js_modules/Board.mjs",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(200, res, {'Content-Type':'text/javascript'}, data);
			})
			return
		case "/favicon.ico":
			fs.readFile("./public/img/apple.svg",function(err, data){
				if (err)return_http_error(400, res, "file not found");
				else return_http_result(200, res, {'Content-Type':'image/svg+xml'}, data);
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
		else return_http_result(200, res, headers, data);
	});
})

server.listen(port, ():void=>{
    console.log("server is listening on port: " + port);
});


const ws_server = new ws.WebSocketServer({
	port: 3000
});

let sockets = [];
let socket_games:any = [];
let id_games:any = [];
let bot_id_games:any = [];

ws_server.on('connection', function(socket) {
	sockets.push(socket);
	const socket_id = Math.floor(Math.random()*1000000)
	let is_against_bot:boolean = false;
	let is_against_player:boolean = false;
	let bot_level:number;

	socket.on('message', function(m) {
		const msg:string = m.toString();
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
				else bot_level = Number((msg.match(/^stockfish:(\d*)/) || ["","10"])[1]);
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