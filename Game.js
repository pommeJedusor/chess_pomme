(function() {
    module.exports.Game = class Game{
        constructor(player_1, id){
            this.player_1 = player_1;
            this.player_2 = undefined;
            this.id = id;
            this.moves = [];
        }
    }
}());