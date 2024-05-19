import fs from "fs";
import http from "http";
import * as ws from "ws";
import * as ejs from "ejs";
import * as UserModel from "../model/User.mjs";
import * as Game from "../js_modules/Game.mjs"
import { User, game, Move } from "../types";

function return_http_error(error_code:number, res:http.ServerResponse<http.IncomingMessage>, status_message:string|undefined):void{
	res.writeHead(error_code, status_message);
	res.end();
}
function return_http_result(code:number, res:http.ServerResponse<http.IncomingMessage>, headers:http.OutgoingHttpHeaders, data:string|Buffer):void{
	res.writeHead(code, headers);
	res.write(data);
	res.end();
}

function get_free_id(id_games:game[]):number{
  for (let i=0;i<id_games.length;i++){
    if (id_games[i] === undefined){
      return i;
    }
  }
  return id_games.length;
}

async function main(req:http.IncomingMessage, res:http.ServerResponse<http.IncomingMessage>, user:User|false, sockets:ws.WebSocket[], socket_games:game[], id_games:game[], bot_id_games:game[]){
  const url:string = req.url || "";
	const parameters:string = url.replace(/\?.*/gm, "").substring(4);
  console.log(parameters);
  let text_response = "";
  switch (parameters){
    case "/init_game":
      req.on("data", (data)=>text_response+=data)
      .on("end", async ()=>{
        let datas:{"timer":any};
        try {
          datas = JSON.parse(text_response);
          if (typeof datas.timer !== "number"){
            throw "";
          }
        }catch{
          return return_http_error(400, res, "the datas is not valid json");
        }
        const timer:number = datas.timer;
        console.log(timer);
        const id:number = get_free_id(id_games);

        if (timer < 5000){
          return return_http_error(400,res,"timer is too short, 5 seconds is the minimum required");
        }

        const game:game = new Game.Game(id, timer);
        id_games[id] = game;

        return return_http_result(200, res,{'Content-Type':'json'}, JSON.stringify({"id_game": id}));
      });
      break;
    case "/join_game":
      req.on("data", (data)=>text_response+=data)
      .on("end", async ()=>{
        const datas:Array<string> = text_response.split("&");
        const id_game:number = Number(datas.filter((data)=>/^id=/.test(data))[0]?.replace(/^id=/, ""));

        if (id_game !== id_game){
          return return_http_error(400, res, "the id of the game is not valid");
        }
        if (!id_games[id_game]){
          return return_http_error(400, res, "the id of the game does not corresponsd with any of the games currently existing");
        }

        const game:game = id_games[id_game];
        let player_id_game:string|null = null;

        if (game.player_1 === undefined){
          game.player_1 = new Game.Player(game.timestamp, user ? user : undefined);
          player_id_game = game.player_1.player_id_game;
        }else if (game.player_2 === undefined){
          game.player_2 = new Game.Player(game.timestamp, user ? user : undefined);
          player_id_game = game.player_2.player_id_game;
        }

        return return_http_result(200, res,{'Content-Type':'json'}, JSON.stringify({
          "player_id_game": player_id_game,
          "timestamp": game.timestamp
        }));
      });
  }
}

export { main }
