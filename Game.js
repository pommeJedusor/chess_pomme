(function() {
    module.exports.Game = class Game{
        constructor(player_1, id){
            this.player_1 = player_1;
            this.player_2 = undefined;
            this.id = id;
            this.moves = [];
        }
    }
    
    module.exports.Move = class Move{
        constructor(move, timestamp, player){
            this.player = player;
            this.move = move;
            this.timestamp = timestamp;
        }
    }

    module.exports.Player = class Player{
        constructor(socket, total_timestamp){
            this.socket = socket;
            this.total_timestamp = total_timestamp;
        }
    }
}());