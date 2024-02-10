exports.Game = class Game{
    constructor(player_1, id){
        this.player_1 = player_1;
        this.player_2 = undefined;
        this.id = id;
        this.moves = [];
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