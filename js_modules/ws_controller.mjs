import * as ws_chess from "./ws.mjs";
import * as Game from "./Game.mjs"

function close(sockets, socket_games, id_games, socket, socket_id){
    const game = socket_games[socket_id];
    if (game===undefined){
        sockets = sockets.filter(s => s !== socket);
        return;
    }
    //if game was still playing
    if (game.player_1 && game.player_2 && !game.result){
        if (game.player_1.socket===socket){
            game.finish(game.player_2, "by quit", id_games, socket_games, sockets);
            game.player_1 = null;
        }else{
            game.finish(game.player_1, "by quit", id_games, socket_games, sockets);
            game.player_2 = null;
        }
    }
    //if game was finished
    else if (game.player_1 && game.player_2 && game.result){
        if (game.player_1===socket){
            game.player_1 = null;
        }else{
            game.player_2 = null;
        }
    }
    //if only one player left
    else {
        game.close(id_games, socket_games, sockets);
    }
}

function ws_controller(sockets, socket_games, id_games, socket, socket_id, msg){
    if (!socket_games[socket_id]){
        socket.send("E:Vous n'êtes dans une partie");
        return;
    }
    else if (!socket_games[socket_id].player_1 || !socket_games[socket_id].player_2){
        socket.send("E:l'autre joueur a quitté");
        return;
    }
    //messages
    else if (/^M:/.test(msg)){
        let game = socket_games[socket_id];
        if (!game.player_2){
            socket.send("E:l'autre joueur n'as pas encore rejoint");
            return;
        }
        game.player_1.socket.send(msg);
        if (game.player_2)game.player_2.socket.send(msg);
    }
    //remactch proposal
    else if (/^RP:/.test(msg)){
        let game = socket_games[socket_id];
        const current_player = game.player_2.socket_id===socket_id ? game.player_2 : game.player_1;
        const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
        if (current_player.rematch_proposal){
            socket.send("E:vous avez déjà proposé une revanche");
        }
        else if (other_player.rematch_proposal){
            //reset player data
            current_player.rematch_proposal = false;
            other_player.rematch_proposal = false;
            current_player.draw_proposal = false;
            other_player.draw_proposal = false;
            current_player.total_timestamp = game.timestamp;
            other_player.total_timestamp = game.timestamp;

            let new_game = new Game.Game(game.id, game.timestamp);
            new_game.player_1 = game.player_2;
            new_game.player_2 = game.player_1;
            socket_games[current_player.socket_id] = new_game;
            socket_games[other_player.socket_id] = new_game;
            id_games[new_game.id] = new_game
            new_game.player_1.socket.send("S:1");
            new_game.player_2.socket.send("S:2");

            //check timer
            const check_timeout_id = setInterval(function (){
                const result = game.check_timeout(id_games, socket_games, sockets)
                if (result){
                    sockets = result;
                    clearInterval(check_timeout_id);
                }else if (game.result){
                    clearInterval(check_timeout_id);
                }
            }, 1000);
        }
        else{
            current_player.rematch_proposal = true;
            socket.send("E:vous avez proposé une revanche")
            other_player.socket.send("RP:");
        }
    }
    //remactch proposal declined
    else if (/^RD:/.test(msg)){
        let game = socket_games[socket_id];
        const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
        if (!other_player.rematch_proposal){
            socket.send("E:l'autre joueur n'as pas proposé de revanche");
        }else{
            other_player.rematch_proposal = false;
            socket.send("E:vous avez refusé la revanche")
            other_player.socket.send("RD:");
        }
    }
    //remactch proposal canceled
    else if (/^RC:/.test(msg)){
        let game = socket_games[socket_id];
        const current_player = game.player_2.socket_id===socket_id ? game.player_2 : game.player_1;
        const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
        if (!current_player.rematch_proposal){
            socket.send("E:vous n'aviez pas proposé de revanche");
        }else{
            current_player.rematch_proposal = false;
            socket.send("E:vous avez annulé votre proposition de revanche");
            other_player.socket.send("RC:");
        }
    }
    else if (socket_games[socket_id].result){
        socket.send("E:la partie est déjà finie")
    }
    //draw (proposal, decline or accept)
    else if (/^D/.test(msg)){
        ws_chess.draws(socket, socket_id, msg, id_games, socket_games, sockets);
    }
    //resign
    else if (/^R:/.test(msg)){
        let game = socket_games[socket_id];
        if (!game.player_2){
            socket.send("E:l'autre joueur n'as pas encore rejoint");
            return;
        }
        const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
        game.finish(other_player, "resign", id_games, socket_games, sockets);
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
                game.finish(winner, "timeout", id_games, socket_games, sockets);
                return;
            }
            (current_player===game.player_1 ? game.player_2 : game.player_1).socket.send(msg);
            if (msg[msg.length-1]==="#"){
                const winner = current_player;
                game.finish(winner, "checkmate", id_games, socket_games, sockets);
            }
            else if (game.board.get_every_moves().length===0){
                game.finish(null, "stalemate", id_games, socket_games, sockets);
            }
            other_player.draw_proposal = false;//reset draw proposal
        }else socket.send("E:C'est au tour de l'autre joueur");
    }
}

export { ws_controller, close };
