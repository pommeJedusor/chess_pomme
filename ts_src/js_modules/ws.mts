import * as Game from "./Game.mjs";

function chose_first_player(game:Game.Game, player_1:Game.Player, player_2:Game.Player):void{
    //chose first player
    const pile_face:number = Math.floor(Math.random()*2);
    if (pile_face===0){
        game.player_1 = player_1;
        game.player_2 = player_2;
    }
    else {
        game.player_1 = player_2;
        game.player_2 = player_1;
    }
}

function join_create_game(socket:WebSocket, socket_id:number, msg:string, id_games:(Game.Game|undefined)[], socket_games:(Game.Game|undefined)[], sockets:(WebSocket|undefined)[]){
    if (!/^ID:\d{1,5}|minutes:\d{1,2}|seconds:\d{1,2}$/.test(msg)){
        socket.send("E: l'id game n'est pas valide");
        return;
    }
    const id = msg.match(/ID:(\d*)\|/)[1];
    const minutes = Number(msg.match(/minutes:(\d*)\|/)[1]);
    const seconds = Number(msg.match(/seconds:(\d*)$/)[1]);
    const timer = minutes * 60 * 1000 + seconds *1000//(minutes * seconds * ms) + (seconds * ms)
    if (id_games[id]===undefined){
        console.log("player 1 create the game");
        let player = new Game.Player(socket, socket_id, timer);
        let game = new Game.Game(player, id);
        socket_games[socket_id] = game;
        id_games[game.id] = game;
    }else if (id_games[id].player_2===undefined){
        console.log("player 2 join the game");
        let game = id_games[id]
        socket_games[socket_id] = game;
        let player = new Game.Player(socket, socket_id, timer);

        chose_first_player(game, game.player_1, player);
        game.player_1.socket.send("S:1");
        game.player_2.socket.send("S:2");
        const check_timeout_id = setInterval(function (){
            game.check_timeout(id_games, socket_games, sockets)
            if (game.result){
                clearInterval(check_timeout_id);
            }
        }, 1000);
    }else {
        socket.send("E:la partie est déjà complète");
    }
}

function draws(socket, socket_id, msg, id_games, socket_games, sockets){
    let game = socket_games[socket_id];
    if (!game.player_2){
        game.player_1.socket.send("E:l'autre joueur n'as pas encore rejoint");
        return;
    }
    const current_player = game.player_1.socket_id===socket_id ? game.player_1 : game.player_2;
    const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
    //draw proposal
    if (/^DP$/.test(msg)){
        if (current_player.draw_proposal===false){
            if (other_player.draw_proposal===true){
                game.finish(null, "mutual agreement", id_games, socket_games, sockets);
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
            game.finish(null, "mutual agreement", id_games, socket_games, sockets)
        }else {
            current_player.socket.send("E:pas d'offre de nulle valide pour le moment");
        }
    }
}

export { join_create_game, draws, chose_first_player };