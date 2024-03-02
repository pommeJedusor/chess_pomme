import * as Game from "../js_modules/Game.mjs";
import { get_move } from "./get_moves.mjs";

const STOCKFISH = -1;

async function get_stockfish_move(game, bot_level){
    await get_move(game, bot_level);
    const move = game.board.moves.at(-1).get_notation_move();
    return move;
}

async function join_game(socket, socket_id, msg, id_games, socket_games, sockets){
    //find the lowest id game as possible
    let id = id_games.length;
    for (let i=0;i<id_games.length;i++){
        if (id_games[i]===undefined){
            id = i;
            break;
        }
    }
    //const id = msg.match(/(?<=ID:)\d*$/)[0];
    const minutes = Number(msg.match(/minutes:(\d*)\|/)[1]);
    const seconds = Number(msg.match(/seconds:(\d*)$/)[1]);
    const timer = minutes * 60 * 1000 + seconds * 1000 //minutes * seconds * ms + (seconds * ms)
    if (id_games[id]!==undefined){
        socket.send("E:la partie est déjà complète");
        return;
    }
    console.log("player against stockfish");
    let player = new Game.Player(socket, socket_id, timer);
    let stockfish = new Game.Player(null, -1, timer);
    let game = new Game.Game(player, id);
    socket_games[socket_id] = game;
    id_games[game.id] = game;
    //chose first player
    const pile_face = Math.floor(Math.random()*2);
    if (pile_face===0){
        game.player_1 = stockfish;
        game.player_2 = player;

        game.player_2.socket.send("S:2");
        const move = await get_stockfish_move(game);
        socket.send(move);
        game.moves.push(new Game.Move(move, Date.now(), 1));
    }
    else {
        game.player_1 = player;
        game.player_2 = stockfish;

        game.player_1.socket.send("S:1");
    }
    
    const check_timeout_id = setInterval(function (){
        const result = game.check_timeout(id_games, socket_games, sockets)
        if (result){
            sockets = result;
            clearInterval(check_timeout_id);
        }
    }, 1000);
}

function close(sockets, socket_games, id_games, socket, socket_id){
    const game = socket_games[socket_id];
    if (game===undefined){
        sockets = sockets.filter(s => s !== socket);
        return;
    }
    //if only one player left
    else {
        sockets  = game.close(id_games, socket_games, sockets);
    }
}

async function controller(sockets, socket_games, id_games, socket, socket_id, msg, bot_level){
    console.log("stockfish")
    if (/^stockfish:/.test(msg)){
        join_game(socket, socket_id, msg, id_games, socket_games, sockets);
    }
    else if (!socket_games[socket_id]){
        socket.send("E:vous n'avez pas initié de partie contre stockfish");
    }
    else if (/^R:/.test(msg)){
        let game = socket_games[socket_id];
        const other_player = game.player_2.socket_id===socket_id ? game.player_1 : game.player_2;
        sockets = game.finish(other_player, "par abandon", id_games, socket_games, sockets);
    }
    else if (/^M:/.test(msg)){
        socket.send(msg);
        socket.send("E:stockfish ne lit pas les messages");
    }
    else if (/^DP/.test(msg)){
        socket.send("E:impossible de proposer nulle à stockfish");
    }
    else {
        let game = socket_games[socket_id];
        const player_turn = game.moves.length%2+1;

        if ((game.player_1.socket_id===STOCKFISH && player_turn===2) || (game.player_2.socket_id===STOCKFISH && player_turn===1)){
            if (game.result){
                socket.send("E:partie déjà finie");
                return;
            }
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
            if (msg[msg.length-1]==="#"){
                const winner = current_player;
                sockets = game.finish(winner, "par mat", id_games, socket_games, sockets);
            }
            else if (game.board.get_every_moves().length===0){
                sockets = game.finish(null, "par pat", id_games, socket_games, sockets);
            }
            other_player.draw_proposal = false;//reset draw proposal
            if (game.result)return;
            const stockfish_move_notation = await get_stockfish_move(game, bot_level);
            const stockfish_move = new Game.Move(stockfish_move_notation, Date.now(), player_turn%2+1)
            socket.send(stockfish_move_notation);
            game.moves.push(stockfish_move);
            other_player.total_timestamp-= game.moves.length<=2 ? 0 : stockfish_move.timestamp - game.moves.at(-2).timestamp;
            if (stockfish_move_notation.endsWith("#")){
                sockets = game.finish(other_player, "par mat", id_games, socket_games, sockets);
            }
        }else socket.send("E:C'est au tour de l'autre joueur");
    }
}

export { controller, close};