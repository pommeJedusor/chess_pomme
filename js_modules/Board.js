const WHITE = 0;
const BLACK = 1;
const COLUMNS = ["a", "b", "c", "d", "e", "f", "g", "h"]

class Piece{
    constructor(x, y, color, name){
        this.x = x;
        this.y = y;
        this.color = color;
        this.name = name;
    }
    get_moves(board, last_move){
        return [];
    }
}

class Pawn extends Piece{
    constructor(x, y, color){
        super(x, y, color, "pawn");
    }
    get_moves(board, last_move){
        const dir = this.color===WHITE ? 1 : -1;
        let moves = [];
        //check forward moves
        if (board[this.y+dir][this.x]===0 && [0,7].includes(this.y+dir)){
                let move = COLUMNS[this.x]+(this.y+dir+1).toString()+"=";
                moves.push(move+"Q");
                moves.push(move+"R");
                moves.push(move+"B");
                moves.push(move+"N");
        }else if (board[this.y+dir][this.x]===0){
            moves.push(COLUMNS[this.x]+(this.y+dir+1).toString())
            if (board[this.y+dir+1][this.x]===0 && this.y===1)moves.push(COLUMNS[this.x]+(this.y+dir+2).toString())
        }
        return moves;
    }
}
//exports.King = class King extends Piece{}
//exports.Queen = class Queen extends Piece{}
//exports.Bishop = class Bishop extends Piece{}
//exports.Knight = class Knight extends Piece{}
//exports.Rook = class Rook extends Piece{}
exports.Pawn = Pawn;
exports.Piece = Piece;
exports.WHITE = WHITE;
exports.BLACK = BLACK;