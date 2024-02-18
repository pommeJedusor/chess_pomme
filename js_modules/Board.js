const WHITE = 0;
const BLACK = 1;
const PAWN = "P";
const KING = "K";
const BISHOP = "B";
const ROOK = "R";
const KNIGHT = "N";
const QUEEN = "Q";
const COLUMNS = ["a", "b", "c", "d", "e", "f", "g", "h"]

function get_square(x, y){
    return COLUMNS[x] + (y+1);
}

function check_move_append(moves, pattern, player){
    if (typeof pattern === "string")pattern = new RegExp("^"+pattern+"$");

    for (let i = player;i<moves.length;i+=2){
        if (pattern.test(moves[i].get_notation_move()))return true;
    }
    return false;
}

function get_pieces(board, condition, deep=0){
    if (deep===board.length)return [];
    const line = board[deep];
    const line_pieces = line.filter(condition)
    return line_pieces.concat(get_pieces(board, condition, deep+1));
}

function is_valid_square(x, y){
    if (x<0 || y<0 || x>7 || y>7)return false;
    return true;
}

function dir_to_square(old_x, old_y, dir, board){
    const x = old_x+dir[0];
    const y = old_y+dir[1];
    return [x, y, board[y][x]!==0];
}

function get_dirs_knight_king(piece, board, dirs){
    const filter_square = function (piece, board, dir){
        const target_x = piece.x+dir[0];
        const target_y = piece.y+dir[1];
        if (!is_valid_square(target_x, target_y))return false;
        const target_square = board[target_y][target_x];
        return target_square===0 || target_square.color!==piece.color;
    }
    const get_dirs = function (piece, board, dirs){
        return dirs.filter((dir)=>filter_square(piece, board, dir));
    }
    const good_dirs = get_dirs(piece, board, dirs)
    const squares = good_dirs.map((dir)=>dir_to_square(piece.x, piece.y, dir, board));

    return squares;
}

function get_dir_qrb(color, old_x, old_y, board, dir, deep=1){
    const x = old_x+dir[0]*deep;
    const y = old_y+dir[1]*deep;
    if (!is_valid_square(x, y))return [];
    if (board[y][x]===0)return [[x, y]].concat(get_dir_qrb(color, old_x, old_y, board, dir, deep+1));
    if (board[y][x].color!==color)return [[x, y]];
    return [];
}
//get the directions for the queen, the rook and the bishop
function get_dirs_qrb(piece, board, dirs){
    const good_dirs = dirs.map((dir)=>get_dir_qrb(piece.color, piece.x, piece.y, board, dir));
    const good_dirs_filtered = good_dirs.filter((dir)=>dir.length>0);
    //concat
    let final_dirs = [];
    for (const dirs of good_dirs_filtered){
        for (const dir of dirs){
            final_dirs.push(dir);
        }
    }
    const squares = final_dirs.map((dir)=>dir_to_square(0, 0, dir, board));
    return squares;
}

class Move{
    constructor(piece, current_x, current_y, target_x, target_y, is_taking=false){
        this.piece = piece;
        this.x = current_x;
        this.y = current_y;
        this.target_x = target_x;
        this.target_y = target_y;
        this.is_taking = is_taking;
        this.is_check = false;
        this.is_mate = false;
        this.precision = "";//if two piece of the same type can go on the same square
        this.promotion = "";
    }
    get_target_square(){
        return get_square(this.target_x, this.target_y);
    }
    get_piece_notation(){
        if (this.piece===PAWN && !this.is_taking)return "";
        else if (this.piece===PAWN)return COLUMNS[this.x];
        return this.piece;
    }
    get_notation_move(){
        const piece = this.get_piece_notation();
        const precision = this.precision;
        const taking = this.is_taking ? "x" : "";
        const target_square = this.get_target_square();
        const promotion = this.promotion;
        const check = this.is_check ? "+" : "";
        const mate = this.is_mate ? "#" : "";
        //check if castle
        if (this.piece===KING && this.target_x===this.x-2){
            return "O-O-O"+check+mate;
        }else if (this.piece===KING && this.target_x===this.x+2){
            return "O-O"+check+mate;
        }
        return piece+precision+taking+target_square+promotion+check+mate;
    }
}

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
        return check_move_append(this.moves, pattern, player);
    }
    get_every_moves(){
        let moves = [];
        for (const squares of this.board){
            for (const square of squares){
                if (square===0 || square.color!==this.moves.length%2)continue;
                moves.push(...square.get_moves(this.board, square, this.moves));
            }
        }
        let moves_hashtable = [];
        for (const move of moves){
            const notation = move.get_notation_move();
            if (!moves_hashtable[notation])moves_hashtable[notation]=[move];
            else moves_hashtable[notation].push(move);
        }
        for (const [notation, moves] of Object.entries(moves_hashtable)) {
            if (moves.length<2)continue;
            for (let i=0;i<moves.length;i++){
                const move = moves_hashtable[notation][i];
                let same_column = false;
                let same_line = false;
                for (let j=0;j<moves.length;j++){
                    if (j===i)continue;
                    if (moves[i].x===moves[j].x)same_column=true;
                    if (moves[i].y===moves[j].y)same_line=true;
                }
                if (same_line && same_column)move.precision=get_square(move.x, move.y);
                else if (same_column)move.precision=(move.y+1).toString();
                else move.precision=COLUMNS[move.x];
            }
        }
        return moves;
    }
}

class Piece{
    constructor(x, y, color, type){
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
    }
    is_legal_move(board, move){
        const piece = board[move.y][move.x];
        const square_taken = piece.move(board, move.target_x, move.target_y);
        const king = get_pieces(board ,(square)=>square && square.color===piece.color && square.type===KING)[0];
        const is_legal = !king.is_in_check(board);
        piece.undo_move(board, move.x, move.y, square_taken);
        return is_legal;
    }
    do_move(board, move, edit_func){
        const piece = this;
        const new_board = board.map(function (squares, y){
            return squares.map(function (square, x){
                return edit_func(piece, square, x, y, board, move);
            });
        });
        return new_board;
    }
    move(board, x, y){
        const square = board[y][x];
        board[y][x] = this;
        board[this.y][this.x] = 0;
        this.y = y;
        this.x = x;
        return square;
    }
    undo_move(board, x, y, piece){
        board[y][x] = this;
        board[this.y][this.x] = piece;
        this.y = y;
        this.x = x;
    }
    get_moves(board, piece, all_moves){
        const squares = piece.get_squares(board, piece, all_moves);
        const moves = squares.map((square)=>new Move(piece.type, piece.x, piece.y, square[0], square[1], square[2]));
        const legal_moves = moves.filter((move)=>piece.is_legal_move(board, move));
        return legal_moves;
    }
}

class Pawn extends Piece{
    constructor(x, y, color){
        super(x, y, color, PAWN);
    }
    edit_func(piece, square, x, y, board, move){
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y){
            if (move.promotion==="")return new Pawn(x, y, piece.color, piece.type);
            switch (move.promotion[1]){
                case "Q":
                    return new Queen(x, y, piece.color, move.promotion[1]);
                case "R":
                    return new Rook(x, y, piece.color, move.promotion[1]);
                case "B":
                    return new Bishop(x, y, piece.color, move.promotion[1]);
                case "N":
                    return new Knight(x, y, piece.color, move.promotion[1]);
            }
        }
        else return square;
    }
    check_promotion(piece_type, piece_x, piece_y, x, y, is_taking){
        let moves;
        if (y===7 || y===0){
            let promotions = ["=Q", "=R", "=N", "=B"];
            moves = promotions.map(function (promotion){
                const move = new Move(piece_type, piece_x, piece_y, x, y, is_taking);
                move.promotion = promotion;
                return move;
            });
        }else {
            moves = [new Move(piece_type, piece_x, piece_y, x, y, is_taking)];
        }
        return moves;
    }
    get_moves(board, piece, all_moves) {
        let moves = [];
        const x = piece.x;
        const y = piece.y;
        const direction = piece.color ? -1 : 1;
        //single and double push
        if (board[y+direction][x]===0){
            moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y+direction,false));
            if (((y+direction*2===4 && y===6) || (y+direction*2==3 && y===1)) && board[y+direction*2][x]===0){
                moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y+direction*2,false));
            }
        }
        //normal takes
        const xys = [[x-1, y+direction], [x+1, y+direction]]
        for (const xy of xys){
            const x = xy[0];
            const y = xy[1];
            if (!is_valid_square(x, y))continue;
            const square = board[y][x];
            if (square && square.color!==piece.color){
                moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y,true));
            }
            
        }
        const last_move = all_moves.at(-1);
        for (const move of [-1, 1]){
            const x = piece.x + move;
            const y = piece.y + direction;
            const test_last_move = new RegExp("^"+get_square(x, piece.y)+"$");
            if (test_last_move.test(last_move)){
                if (!check_move_append(all_moves, get_square(x, y), (piece.color+1)%2)){
                    moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y,true));
                }
            }
        }
        const legal_moves = moves.filter((move)=>piece.is_legal_move(board, move));
        return legal_moves;
    }
}
class King extends Piece{
    constructor(x, y, color){
        super(x, y, color, KING);
    }
    edit_func(piece, square, x, y, board, move){
        const is_castle_king = move.x-move.target_x===-2;
        const is_castle_queen = move.x-move.target_x===2;
        const rook_x = is_castle_king ? 7 : 0;
        const new_rook_x = is_castle_king ? 5 : 3;
        if ((is_castle_king || is_castle_queen) && y===move.y && x===rook_x)return 0;
        if ((is_castle_king || is_castle_queen) && y===move.y && x===new_rook_x){
            return new Rook(new_rook_x, y, piece.color);
        }
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new King(x, y, piece.color);
        else return square;
    }
    get_moves(board, piece, all_moves){
        let moves = [];
        const dirs = [-1, 0, 1];
        for (const y_dir of dirs){
            for (const x_dir of dirs){
                const y = piece.y+y_dir;
                const x = piece.x+x_dir;
                if (!is_valid_square(x, y))continue;
                const move = new Move(piece.type, piece.x, piece.y, x, y);
                const square = board[y][x];
                if (square===0 || square.color!==piece.color){
                    if (square!==0)move.is_taking=true;
                    moves.push(move);
                }
            }
        }
        //check castle
        if (check_move_append(all_moves, /^[KO]/, piece.color) || piece.is_in_check(board)){
            return moves.filter((move)=>piece.is_legal_move(board, move));
        }
        //check kingside castle
        const king_y = (piece.y+1).toString();
        const pattern_kingside = new RegExp("^Rh?"+king_y+"?(h[1-8](?<!"+king_y+")|[fg]"+king_y+")$");
        if (!check_move_append(all_moves, pattern_kingside, piece.color)){
            if (board[piece.y][5]===board[piece.y][6] && board[piece.y][5]===0){
                if (piece.is_legal_move(board ,new Move(piece, piece.x, piece.y, piece.x+1, piece.y))){
                    moves.push(new Move(piece.type, piece.x, piece.y, piece.x+2, piece.y, false));
                }
            }
        }
        //check queenside castle
        const pattern_queenside = new RegExp("^Ra?"+king_y+"?(a[1-8](?<!"+king_y+")|[bcd]"+king_y+")$");
        if (!check_move_append(all_moves, pattern_queenside, piece.color)){
            if (board[piece.y][1]===board[piece.y][2] && board[piece.y][3]===0 && board[piece.y][1]===0){
                if (piece.is_legal_move(board ,new Move(piece, piece.x, piece.y, piece.x-1, piece.y))){
                    moves.push(new Move(piece.type, piece.x, piece.y, piece.x-2, piece.y, false));
                }
            }
        }
        const legal_moves = moves.filter((move)=>piece.is_legal_move(board, move));
        return legal_moves;
    }
    is_in_check(board){
        //check pawn
        const pawn_y = [1, -1][this.color];
        const pawn_dirs = [[pawn_y, 1], [pawn_y, -1]];
        for (const pawn_dir of pawn_dirs){
            const y = this.y+pawn_dir[0];
            const x = this.x+pawn_dir[1];
            if (!is_valid_square(x, y))continue;
            const square = board[y][x];
            if (square!==0 && square.type===PAWN && square.color!==this.color)return true;
        }
        //rook
        const rook_dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]];
        for (const rook_dir of rook_dirs){
            let i = 1;
            let y = this.y+rook_dir[0];
            let x = this.x+rook_dir[1];
            while (is_valid_square(x, y)){
                const square = board[y][x];
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
            while (is_valid_square(x, y)){
                const square = board[y][x];
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
            if (!is_valid_square(x, y))continue;
            const square = board[y][x];
            if (square && square.color!==this.color && square.type===KNIGHT)return true;
        }
        //king
        const king_dirs = [-1, 0, 1];
        for (const dir1 of king_dirs){
            for (const dir2 of king_dirs){
                const y = this.y+dir1;
                const x = this.x+dir2;
                if (!is_valid_square(x, y))continue;
                const square = board[y][x];
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
    edit_func(piece, square, x, y, board, move){
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Bishop(x, y, piece.color, piece.type);
        else return square;
    }
    get_squares(board, piece) {
        const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        return get_dirs_qrb(piece, board, dirs);
    }
}
class Rook extends Piece {
    constructor(x, y, color){
        super(x, y, color, ROOK);
    }
    edit_func(piece, square, x, y, board, move){
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Rook(x, y, piece.color, piece.type);
        else return square;
    }
    get_squares(board, piece){
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        return get_dirs_qrb(piece, board, dirs);
    }
}
class Knight extends Piece {
    constructor(x, y, color){
        super(x, y, color, KNIGHT);
    }
    edit_func(piece, square, x, y, board, move){
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Knight(x, y, piece.color, piece.type);
        else return square;
    }
    get_squares(board, piece){
        const dirs = [[ 2,  1], [ 2, -1],
                        [-2, -1], [-2,  1],
                        [ 1,  2], [-1,  2],
                        [ 1, -2], [-1, -2]];
        return get_dirs_knight_king(piece, board, dirs);
    }
    
}
class Queen extends Piece {
    constructor(x, y, color){
        super(x, y, color, QUEEN);
    }
    edit_func(piece, square, x, y, board, move){
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Queen(x, y, piece.color, piece.type);
        else return square;
    }
    get_squares(board, piece) {
        const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1],//rook
                      [1, 1], [1, -1], [-1, 1], [-1, -1]];//bishop
        return get_dirs_qrb(piece, board, dirs);
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