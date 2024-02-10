const WHITE = 0;
const BLACK = 1;
const PAWN = 2;
const COLUMNS = ["a", "b", "c", "d", "e", "f", "g", "h"]

class Board{
    constructor(){
        this.board = this.get_new_board();
        this.moves = [];
    }
    get_new_board(){
        let board = [];
        for (let i=0;i<8;i++){
            let line = [];
            for (let i=0;i<8;i++){
                line.push(0);
            }
            board.push(line);
        }
        return board;
    }
}

class Piece{
    constructor(x, y, color, type){
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
    }
    get_moves(board, last_move){
        return [];
    }
}

class Pawn extends Piece{
    constructor(x, y, color){
        super(x, y, color, PAWN);
    }
    add_move(moves, move){
        //if not a promotion
        if (!/(0|8)$/.test(move))moves.push(move);
        else {
            const promotions = ["Q", "R", "B", "N"];
            for (const promotion of promotions)moves.push(move+"="+promotion);
        }
    }
    get_moves(board){
        const dir = this.color===WHITE ? 1 : -1;
        let moves = [];
        //check forward moves
        if (board.board[this.y+dir][this.x]===0){
            const single_move = COLUMNS[this.x]+(this.y+dir+1).toString();
            this.add_move(moves, single_move)
            //double forward i.g:e2->e4
            if ([0,7].includes(this.y-dir) && board.board[this.y+dir+1][this.x]===0)moves.push(COLUMNS[this.x]+(this.y+dir+2).toString());
        }
        //check the takes
        for (const side of [-1, 1]){
            if (this.x+side<0 || this.x+side>7)continue;
            let move = COLUMNS[this.x]+"x"+COLUMNS[this.x+side]+(this.y+dir+1).toString();
            let to_take = board.board[this.y+dir][this.x+side]
            if (to_take!==0 && to_take.color!==this.color){
                this.add_move(moves, move);
                continue;
            }

            //check if there is a pawn to take en-passant
            const en_passant = this.y===4-this.color && board.moves.at(-1)===COLUMNS[this.x+side]+(this.y+1).toString();
            //check if the other pawn had already moved
            const move_searched = COLUMNS[this.x+side]+(this.y+dir+1).toString();
            for (let i = (this.color+1)%2;i<board.moves.length;i+=2){
                if (board.moves[i]===move_searched)continue;
            }
            if (en_passant)this.add_move(moves, move);
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
exports.Board = Board;
exports.WHITE = WHITE;
exports.BLACK = BLACK;