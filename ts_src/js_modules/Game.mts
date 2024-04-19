import { board, move, piece } from "../types";

import * as Board from "./Board.mjs";
import * as ModelGame from "../model/Game.mjs";

class Game{
    player_1:Player;
    player_2:Player|undefined;
    id:number;
    board:board;
    moves:Move[];
    result:string|null;
    timestamp; //minutes * seconds * ms
    constructor(player_1:Player, id:number){
        this.player_1 = player_1;
        this.player_2 = undefined;
        this.id = id;
        this.board = new Board.Board();
        this.moves = [];
        this.result = null;
        this.timestamp = 20 * 60 * 1000; //minutes * seconds * ms
    }
    play(move:string, filter_good_move=(m:move)=>m.get_notation_move()===move):boolean{
        const moves:move[] = this.board.get_every_moves(0);
        const good_moves:move[] = moves.filter(filter_good_move);
        if (good_moves.length===0){
            console.log(moves.map((move)=>move.get_notation_move()));
            console.log(move)
            return false;
        }
        const good_move:move = good_moves[0];

        const piece:piece = this.board.board[good_move.y][good_move.x] as piece;
        this.board.make_move(piece, good_move);
        console.log(good_move.get_notation_move());
        return true;
    }
    finish(winner:Player, message:string, id_games:number[], socket_games, sockets:WebSocket){
        if (winner===null){
            if (this.player_1 && this.player_1.socket)this.player_1.socket.send("R:D:"+message);
            if (this.player_2 && this.player_2.socket)this.player_2.socket.send("R:D:"+message);
            this.result = "D";
        }
        else if (this.player_1===winner){
            if (this.player_1 && this.player_1.socket)this.player_1.socket.send("R:W:"+message);
            if (this.player_2 && this.player_2.socket)this.player_2.socket.send("R:L:"+message);
            this.result = "W";
        }else if (this.player_2===winner){
            if (this.player_1 && this.player_1.socket)this.player_1.socket.send("R:L:"+message);
            if (this.player_2 && this.player_2.socket)this.player_2.socket.send("R:W:"+message);
            this.result = "L";
        }

        //insert in db
        const winner_db = this.result === "D" ? "draw" : "W" ? "white" : "black";
        ModelGame.insert_game(this.get_pgn(), winner_db, message);
    }
    close(id_games, socket_games, sockets){
        const do_player_1 = this.player_1 && this.player_1.socket;
        const do_player_2 = this.player_2 && this.player_2.socket;

        if (do_player_1)this.player_1.socket.close();
        if (do_player_2)this.player_2.socket.close();
        //delete the game
        id_games[this.id] = undefined;
        if (do_player_1)socket_games[this.player_1.socket_id] = undefined;
        if (do_player_2)socket_games[this.player_2.socket_id] = undefined;
        //delete sockets
        if (do_player_1)sockets[this.player_1.socket_id] = undefined;
        if (do_player_2)sockets[this.player_2.socket_id] = undefined;
    }
    check_timeout(id_games, socket_games, sockets){
        const player_turn = this.moves.length%2+1;
        const current_player = [this.player_1, this.player_2][player_turn-1];
        //if game finished
        if (!current_player)return;
        const total_timestamp = current_player.total_timestamp - (this.moves.length<2 ? 0 : Date.now() - this.moves.at(-2).timestamp);
        if (total_timestamp<=0){
            const winner = this.player_1===current_player ? this.player_2 : this.player_1;
            this.finish(winner, "timeout", id_games, socket_games, sockets);
        }
    }
    get_pgn(){
        let pgn = "";
        for (let i=0;i<this.moves.length;i++){
            console.log(this.moves[i].move)
            const move = this.moves[i].move;
            if (i)pgn+=" ";
            if (i%2===0)pgn+=`${Math.floor(i/2)+1}. `;
            pgn+=move;
        }
        return pgn;
    }
}

class Player{
    constructor(socket,socket_id, total_timestamp){
        this.socket = socket;
        this.socket_id = socket_id;
        this.total_timestamp = total_timestamp;
        this.draw_proposal = false;
        this.rematch_proposal = false;
    }
}

class Move{
    move;
    timestamp:number;
    player:Player;
    constructor(move, timestamp:number, player:Player){
        this.move = move;
        this.timestamp = timestamp;
        this.player = player;
    }
}

export { Game, Player, Move };