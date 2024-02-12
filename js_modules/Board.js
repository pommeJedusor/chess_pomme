const WHITE = 0;
const BLACK = 1;
const PAWN = "P";
const KING = "K";
const BISHOP = "B";
const ROOK = "R";
const KNIGHT = "N";
const QUEEN = "Q";
const COLUMNS = ["a", "b", "c", "d", "e", "f", "g", "h"]

class Board{
    constructor(){
        this.board = this.get_new_board();
        this.moves = [];
    }
    see_board(){
        for (let i=this.board.length-1;i>=0;i--){
            let text = "";
            const squares = this.board[i];
            for (const square of squares){
                if (square===0)text+=" ";
                else text+=square.type;
            }
            console.log(text);
        }
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

        let pieces = [];
        //pawns
        for (let i=0;i<8;i++){
            pieces.push(new Pawn(i, 1, WHITE), new Pawn(i, 6, BLACK));
        }
        //queen
        pieces.push(new Queen(3, 0, WHITE), new Queen(3, 7, BLACK));
        //king
        pieces.push(new King(4, 0, WHITE), new King(4, 7, BLACK));
        //bishop
        pieces.push(new Bishop(2, 0, WHITE), new Bishop(2, 7, BLACK),
                    new Bishop(5, 0, WHITE), new Bishop(5, 7, BLACK));
        //knight
        pieces.push(new Knight(1, 0, WHITE), new Knight(1, 7, BLACK),
                    new Knight(6, 0, WHITE), new Knight(6, 7, BLACK));
        //rook
        pieces.push(new Rook(0, 0, WHITE), new Rook(0, 7, BLACK),
                    new Rook(7, 0, WHITE), new Rook(7, 7, BLACK));

        for (const piece of pieces){
            board[piece.y][piece.x] = piece;
        }
        return board;
    }
    check_move_append(pattern, player){
        if (typeof pattern === "string")pattern = new RegExp("^"+pattern+"$");

        for (let i = player;i<this.moves.length;i+=2){
            if (pattern.test(this.moves[i]))return True;
        }
        return false;
    }
    get_all_moves(){
        let moves = [];
        for (const lines of this.board){
            for (const square of lines){
                if (square && square.color===this.moves.length%2)moves = moves.concat([square, square.get_moves(this)]);
            }
        }
        return moves;
    }
    make_move(move){
        //return the letter of the piece (if pawn return its current column)
        const piece = move[0];
        const is_check = move.at(-1)==="+";
        const is_mate = move.at(-1)==="#";
        //to avoid getting bother becaus of the + or the #
        if (is_check || is_mate)move = move.substr(0,move.length-1);
        const is_taking = move.includes("x");
        const target_square = move.substr(move.length-2);
        const target_x = COLUMNS.indexOf(target_square[0]);
        const target_y = Number(target_square[1])-1;
        const clean_move = piece+(is_taking?"x":"")+target_square;
        let piece_taken = 0;
        //kingside rook
        if (/^O-O$/.test(move)){
            const y = this.moves.length%2===0 ? 0 : 7;
            const king = this.board[y][4];
            const rook = this.board[y][7];
            king.move(this, king.x+2, y);
            rook.move(this, rook.x-2, y);
        }
        //queenside rook
        else if (/^O-O-O?$/.test(move)){
            const y = this.moves.length%2===0 ? 0 : 7;
            const king = this.board[y][4];
            const rook = this.board[y][0];
            king.move(this, king.x-2, y);
            rook.move(this, rook.x+3, y);
        }
        //pawn
        else if (/[a-h]/.test(piece) && !is_taking){
            console.log(target_x, target_y);
            const dir = this.moves.length%2===0 ? 1 : -1;
            let square = this.board[target_y-dir][target_x];
            if (square && square.type===PAWN){
                square.move(this, target_x, target_y);
            }else {
                square = this.board[target_y-(dir*2)][target_x];
                square.move(this, target_x, target_y);
            }
        }//pawn take
        else if (/[a-h]/.test(piece)){
            const dir = this.moves.length%2===0 ? 1 : -1;
            const current_x = COLUMNS.indexOf(piece);
            const square = this.board[target_y-dir][current_x];
            //en-passant
            if (this.board[target_y][target_x]===0)this.board[target_y-dir][target_x]=0;
            piece_taken = square.move(this, target_x, target_y);
        }
        //get the pieces that could have done the move
        let squares = [];
        for (const lines of this.board){
            for (const square of lines){
                if (square && square.type===piece && square.color===this.moves.length%2){
                    squares.push(square);
                }
            }
        }
        //get the line and column if given in the move
        let column = null;
        let line = null;
        if (/[a-h]/.test(move[1]) && move.length>(3+/[+#]/.test(move.at(-1)))){
            column = COLUMNS.indexOf(move[1]);
            if (/[1-8]/.test(move[2]))line=Number(move[2])-1;
        }else{
            if (/[1-8]/.test(move[1]))line=Number(move[1])-1;
        }
        //if line or column precised filter
        let new_squares = [];
        console.log(column, line)
        for (const square of squares){
            if ((square.x===column || column===null) && (square.y===line || line===null)){
                new_squares.push(square);
            }
        }
        for (const square of new_squares){
            const moves = square.get_moves(this);
            if (moves.includes(clean_move)){
                piece_taken = square.move(this, target_x, target_y);
                break;
            }
        }
        console.log(new_squares);
        this.moves.push(move);
        return piece_taken;
    }
}

class Piece{
    constructor(x, y, color, type){
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
    }
    move(board, x, y){
        const square = board.board[y][x];
        board.board[y][x] = this;
        board.board[this.y][this.x] = 0;
        this.y = y;
        this.x = x;
        return square;
    }
    generic_get_moves(board, dirs, letter){
        let moves = [];
        for (const dir of dirs){
            let y = this.y+dir[0];
            let x = this.x+dir[1];
            let i = 1;
            while (!(y<0 || x<0 || y>7 || x>7)){
                const square = COLUMNS[x]+(y+1).toString();
                if (board.board[y][x]===0)moves.push(letter+square);
                else if (board.board[y][x].color===this.color)break;
                else if (board.board[y][x].color!==this.color){
                    moves.push(letter+"x"+square);
                    break;
                }
                i++;
                y = this.y+(dir[0]*i);
                x = this.x+(dir[1]*i);
            }
        }
        return moves;
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
            if ([0,7].includes(this.y-dir) && board.board[this.y+(dir*2)][this.x]===0)moves.push(COLUMNS[this.x]+(this.y+(dir*2)+1).toString());
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
            if (!en_passant)continue;
            //check if the other pawn had already moved
            const move_searched = COLUMNS[this.x+side]+(this.y+dir+1).toString();
            if (board.check_move_append(move_searched, (this.color+1)%2))continue;

            this.add_move(moves, move);
        }
        return moves;
    }
}
class King extends Piece{
    constructor(x, y, color){
        super(x, y, color, KING);
    }
    get_moves(board){
        let moves = [];
        const dirs = [-1, 0, 1];
        for (const y_dir of dirs){
            if (this.y+y_dir<0 || this.y+y_dir>7)continue;
            for (const x_dir of dirs){
                if (this.x+x_dir<0 || this.x+x_dir>7)continue;
                if (x_dir===y_dir && x_dir===0)continue;
                const square = COLUMNS[this.x+x_dir]+(this.y+y_dir+1).toString();
                if (board.board[this.y+y_dir][this.x+x_dir]===0)moves.push("K"+square);
                else if (board.board[this.y+y_dir][this.x+x_dir].color!==this.color)moves.push("Kx"+square);
            }
        }
        //check castle
        if (board.check_move_append(/^K/), this.color)return moves;
        //check kingside castle
        const king_y = (this.y+1).toString();
        const pattern_kingside = new RegExp("^Rh?"+king_y+"?(h[1-8](?<!"+king_y+")|[fg]"+king_y+")$");
        if (!board.check_move_append(pattern_kingside, this.color)){
            if (board.board[king_y][1]===board.board[king_y][2] && board.board[king_y][3]===0 && board.board[king_y][1]===0){
                //must check if one of the squares is controlled by an oppenent's peices
            }
        }
        //check queenside castle
        const pattern_queenside = new RegExp("^Ra?"+king_y+"?(a[1-8](?<!"+king_y+")|[bcd]"+king_y+")$");
        if (!board.check_move_append(pattern_queenside, this.color)){
            if (board.board[king_y][5]===board.board[king_y][6] && board.board[king_y][5]===0){
                //must check if one of the squares is controlled by an oppenent's peices
            }
        }
        return moves;
    }
    is_in_check(board){
        //check pawn
        const pawn_y = [1, -1][this.color];
        const pawn_dirs = [[pawn_y, 1], [pawn_y, -1]];
        for (const pawn_dir of pawn_dirs){
            const y = this.y+pawn_dir[0];
            const x = this.x+pawn_dir[1];
            if (y<0 || y>7 || x<0 || x>7)continue;
            const square = board.board[y][x];
            if (square!==0 && square.type===PAWN && square.color!==this.color)return true;
        }
        //rook
        const rook_dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]];
        for (const rook_dir of rook_dirs){
            let i = 1;
            let y = this.y+rook_dir[0];
            let x = this.x+rook_dir[1];
            while (!(x<0 || x>7 || y<0 || y>7)){
                const square = board.board[y][x];
                if (square && square.color!==this.color && [ROOK, QUEEN].includes(square.type))return true;
                else if (square)break;
                i++;
                y = this.y+(rook_dir[0]*i);
                x = this.x+(rook_dir[1]*i);
            }
        }
        //bishop
        const bishop_dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const bishop_dir of bishop_dirs){
            let i = 1;
            let y = this.y+bishop_dir[0];
            let x = this.x+bishop_dir[1];
            while (!(x<0 || x>7 || y<0 || y>7)){
                const square = board.board[y][x];
                if (square && square.color!==this.color && [BISHOP, QUEEN].includes(square.type))return true;
                else if (square)break;
                i++;
                y = this.y+(bishop_dir[0]*i);
                x = this.x+(bishop_dir[1]*i);
            }
        }
        //knight
        const knight_dirs = [[-1, 2], [-1, -2], [1, 2], [1, -2],
                             [-2, 1], [-2, -1], [2, 1], [2, -1]];
        for (const knight_dir of knight_dirs){
            const y = this.y+knight_dir[0];
            const x = this.x+knight_dir[1];
            if (x<0 || x>7 || y<0 || y>7)continue;
            const square = board.board[y][x];
            if (square && square.color!==this.color && square.type===KNIGHT)return true;
        }
        //king
        const king_dirs = [-1, 0, 1];
        for (const dir1 of king_dirs){
            for (const dir2 of king_dirs){
                const y = this.y+dir1;
                const x = this.x+dir2;
                if (x<0 || x>7 || y<0 || y>7)continue;
                const square = board.board[y][x];
                if (square && square.color!==this.color && square.type===KING)return true;
            }
        }
        return false;
    }
}
class Bishop extends Piece{
    constructor(x, y, color){
        super(x, y, color, BISHOP);
    }
    get_moves(board){
        const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
        return this.generic_get_moves(board, dirs, "B");
    }
}
class Rook extends Piece {
    constructor(x, y, color){
        super(x, y, color, ROOK);
    }
    get_moves(board){
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        return this.generic_get_moves(board, dirs, "R");
    }
}
class Knight extends Piece {
    constructor(x, y, color){
        super(x, y, color, KNIGHT);
    }
    get_moves(board){
        let moves = [];
        const dirs = [[ 2,  1], [ 2, -1],
                      [-2, -1], [-2,  1],
                      [ 1,  2], [-1,  2],
                      [ 1, -2], [-1, -2]];

        for (const dir of dirs){
            const y = this.y+dir[0];
            const x = this.x+dir[1];
            const square = COLUMNS[x]+(y+1).toString();
            if (y<0 || x<0 || y>7 || x>7)continue;
            if (board.board[y][x]===0)moves.push("N"+square);
            else if (board.board[y][x].color!==this.color)moves.push("Nx"+square);
        }
        return moves;
    }
}
class Queen extends Piece {
    constructor(x, y, color){
        super(x, y, color, QUEEN);
    }
    get_moves(board){
        const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1],//rook
                      [1, 1], [1, -1], [-1, 1], [-1, -1]];//bishop
        return this.generic_get_moves(board, dirs, "Q");
    }
}
exports.Board = Board;
exports.Pawn = Pawn;
exports.King = King;
exports.Bishop = Bishop;
exports.Rook = Rook;
exports.Knight = Knight;
exports.Queen = Queen;
exports.WHITE = WHITE;
exports.BLACK = BLACK;