import fs from "fs";
import http from "http";
import * as ws from "ws";
import * as ejs from "ejs";
import * as UserModel from "../model/User.mjs";
import * as Game from "../js_modules/Game.mjs"
import { User, game } from "../types";

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
  switch (parameters){
    case "/init_game":
      let text_response = "";
      req.on("data", (data)=>text_response+=data)
      .on("end", async ()=>{
        const datas:Array<string> = text_response.split("&");
        const timer:number = Number(datas.filter((data)=>/^timer=/.test(data))[0].replace(/^timer=/, "")) || 20 * 60 * 1000;
        const id:number = get_free_id(id_games);

        if (timer < 5000){
          return return_http_error(400,res,"timer is too short, 5 seconds is the minimum required");
        }

        const game = new Game.Game(id, timer);
        id_games[id] = game;

        return return_http_result(200, res,{'Content-Type':'json'}, JSON.stringify({"id_game": id}))
      });
      break;
  }
}

export { main }
