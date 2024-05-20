import ws from "ws";
import * as Game from "./Game.mjs";
import { game } from "../types";

function chose_first_player(game:game):void{
  const player_1 = game.player_1;
  const player_2 = game.player_2;
  //chose first player
  const pile_face:number = Math.floor(Math.random()*2);
  if (pile_face===0){
    game.player_1 = player_2;
    game.player_2 = player_1;
  }
}

function join_create_game(socket:ws.WebSocket, socket_id:number, msg:string, id_games:(game|undefined)[], socket_games:(game|undefined)[], sockets:(WebSocket|undefined)[]){
    // spectator mode
  if (/^ID:\d{1,5}$/.test(msg)){
    const id:number = Number(msg.match(/ID:(\d*)$/)![1]);
    const game = id_games[id]
    game?.spectators.push(socket);
    return;
  }
  if (!/^ID:\d{1,5}|player_id_game:[a-zA-Z0-9]{10}$/.test(msg)){
    socket.send("E: the format of the request for joining the game isn't valid");
    return;
  }

  const id:number = Number(msg.match(/ID:(\d*)\|/)![1]);
  const player_id_game:string = msg.match(/player_id_game:([a-zA-Z0-9]*)$/)![1];
  const game = id_games[id]

  if (game===undefined){
    socket.send("E: the game you're trying to join doesn't exists yet, go back to the menu and create it");
    return;
  }

  if (game.player_1 && game.player_1.player_id_game === player_id_game){
    const joined_back = game.player_1.socket_id ? true : false;
    console.log("player 1 join the game");
    game.player_1.socket = socket;
    game.player_1.socket_id = socket_id;
    socket_games[socket_id] = game;
    if (joined_back){
      // send game datas
      socket.send("DATAS:"+JSON.stringify({
        "white_username": game.player_1?.user ? game.player_1.user.username : "You",
        "black_username": game.player_2?.user ? game.player_2.user.username : "Opponent",
        "color": "white",
        "timestamp": game.timestamp,
        "moves": game.moves.map((move)=>{
          return {
            "move": move.move,
            "timestamp": move.timestamp,
          }
        }),
      }));
      return;
    }
  }else if (game.player_2 && game.player_2.player_id_game === player_id_game){
    const joined_back = game.player_2.socket_id ? true : false;
    console.log("player 2 join the game");
    game.player_2.socket = socket;
    game.player_2.socket_id = socket_id;
    socket_games[socket_id] = game;
    if (joined_back){
      // send game datas
      socket.send("DATAS:"+JSON.stringify({
        "white_username": game.player_1?.user ? game.player_1.user.username : "Opponent",
        "black_username": game.player_2?.user ? game.player_2.user.username : "You",
        "color": "black",
        "timestamp": game.timestamp,
        "moves": game.moves.map((move)=>{
          return {
            "move": move.move,
            "timestamp": move.timestamp,
          }
        }),
      }));
      return;
    }
  }else {
    socket.send("E: the player_id_game is incorrect");
    return;
  }

  // launch the game
  if (game.player_2 && game.player_2.socket_id && game.player_1 && game.player_1.socket_id){
    console.log(game.player_1 === game.player_2);
    chose_first_player(game)
    console.log(game.player_1 === game.player_2);

    const white_username = game.player_1.user?.username || "Opponent";
    const black_username = game.player_2.user?.username || "Opponent";
    game.player_1.socket.send(`S:1|${black_username}`);
    game.player_2.socket.send(`S:2|${white_username}`);

    // check if there is a timeout
    const check_timeout_id = setInterval(function (){
      game.check_timeout();
      if (game.result){
        clearInterval(check_timeout_id);
      }
    }, 1000);
  }
}

function draws(socket:ws.WebSocket, socket_id:number, msg:string, id_games:(game|undefined)[], socket_games:(game|undefined)[], sockets:(ws.WebSocket|undefined)[]){
    let game:game = socket_games[socket_id]!;
    if (!game.player_2){
        game.player_1.socket.send("E:l'autre joueur n'as pas encore rejoint");
        return;
    }
    const current_player:Game.Player = game.player_1.socket_id===socket_id ? game.player_1 : game.player_2;
    const other_player:Game.Player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
    //draw proposal
    if (/^DP$/.test(msg)){
        if (current_player.draw_proposal===false){
            if (other_player.draw_proposal===true){
                game.finish(null, "mutual agreement");
            }
            current_player.draw_proposal = true;
            current_player.socket.send("E:vous avez proposé nulle");
            if (other_player)other_player.socket.send("DP");
        }else{
            current_player.socket.send("E:vous avez déjà proposé nulle");
        }
    }
    //draw decline
    else if (/^DD$/.test(msg)){
        if (other_player.draw_proposal){
            other_player.draw_proposal = false;
            current_player.socket.send("E:vous avez refusé la nulle");
            if (other_player)other_player.socket.send("E:l'autre joueur a refusé la nulle");
        }else {
            current_player.socket.send("E:pas d'offre de nulle valide pour le moment");
        }
    }
    //draw accept
    else if (/^DA$/.test(msg)){
        if (other_player.draw_proposal){
            game.finish(null, "mutual agreement")
        }else {
            current_player.socket.send("E:pas d'offre de nulle valide pour le moment");
        }
    }
}

export { join_create_game, draws, chose_first_player };
