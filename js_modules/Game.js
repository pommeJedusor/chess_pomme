const Board = require("./Board");
const Test = require("../test");

exports.Game = class Game{
    constructor(player_1, id){
        this.player_1 = player_1;
        this.player_2 = undefined;
        this.id = id;
        this.board = new Board.Board();
        this.moves = [];
    }
    play(move){
        const moves = this.board.get_every_moves();
        const good_moves = moves.filter((m)=>m.get_notation_move()===move);
        if (good_moves.length===0)return false;
        const good_move = good_moves[0];
        const piece = this.board.board[good_move.y][good_move.x];
        this.board.board = piece.do_move(this.board.board, good_move, piece.edit_func)
        this.board.moves.push(good_move);
        return true;
    }
    finish(winner, message, id_games, socket_games, sockets){
        if (this.player_1===winner){
            this.player_1.socket.send("R:W:"+message);
            this.player_2.socket.send("R:L:"+message);
        }else {
            this.player_1.socket.send("R:L:"+message);
            this.player_2.socket.send("R:W:"+message);
        }
        this.player_1.socket.close();
        this.player_2.socket.close();
        //delete the game
        id_games[this.id] = undefined;
        socket_games[winner.socket_id] = undefined;
        return sockets.filter(s => s !== this.player_2 && s !== this.player_1);
    }
}

exports.Player = class Player{
    constructor(socket,socket_id, total_timestamp){
        this.socket = socket;
        this.socket_id = socket_id;
        this.total_timestamp = total_timestamp;
    }
}

exports.Move = class Move{
    constructor(move, timestamp, player){
        this.player = player;
        this.move = move;
        this.timestamp = timestamp;
    }
}