const WHITE:color = 0;
const BLACK:color = 1;
const COLUMNS:string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

type square = piece | 0;
type boardDatas = square[][];
type color = 0|1
type dir = number[];
type dirs = dir[];
enum piecetype {
    Pawn = "P",
    King = "K",
    Queen = "Q",
    Rook = "R",
    Bishop = "B",
    Knight = "N"
};


interface castles{
    white_kingside:boolean,
    white_queenside:boolean,
    black_kingside:boolean,
    black_queenside:boolean
}

interface squaremove{
    x:number;
    y:number;
    is_taking:boolean;
}

interface piece {
    x:number;
    y:number;
    color:color;
    type:piecetype;
    is_legal_move:(board:board, move:Move, moves:Move[], deep:number)=>boolean;
    edit_func:(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move)=>square;
    do_move:(board:boardDatas, move:Move, edit_func:piece["edit_func"])=>boardDatas;
    get_moves:(board:board, piece:piece, all_moves:Move[], deep:number)=>Move[];
    get_squares?:(board:boardDatas, piece:piece)=>squaremove[];
}

interface board {
    board:boardDatas;
    moves:Move[];
    //current_player: next player to play
    current_player:color;
    //castles: ability for the king to castle in the futur
    castles:castles
    //en_passant: the square over which a pawn has just passed while moving two squares;
    en_passant:string|undefined;
    //halfmove_clock: The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
    halfmove_clock:number;
    //fullmove_number: The number of the full moves. It starts at 1 and is incremented after Black's move.
    fullmove_number:number;
    see_board:()=>void;
    get_new_board:()=>boardDatas;
    get_every_moves:(deep:number)=>Move[];
    make_move:(piece:piece, move:Move)=>void;
    make_move_notation:(piece:piece, move:string)=>void;
    get_board_copy:()=>boardDatas;
    get_copy:()=>board;
}

function get_square(x:number, y:number):string{
    return COLUMNS[x] + (y+1);
}

function get_pieces(board:boardDatas, condition:(square: square)=>boolean):square[]{
    const pieces:square[] = board.flat(1);
    return pieces.filter(condition);
}

function is_valid_square(x:number, y:number):boolean{
    if (x<0 || y<0 || x>7 || y>7)return false;
    return true;
}

function dir_to_square(old_x:number, old_y:number, dir:dir, board:boardDatas):squaremove{
    const x:number = old_x+dir[0];
    const y:number = old_y+dir[1];
    return {
        x: x,
        y: y,
        is_taking: board[y][x]!==0
    };
}

function get_dirs_knight_king(piece:piece, board:boardDatas, dirs:dirs):squaremove[]{
    //check if the destination of the dir is valid for the piece
    const is_valid_dir = function (dir:dir):boolean{
        const target_x:number = piece.x+dir[0];
        const target_y:number = piece.y+dir[1];
        if (!is_valid_square(target_x, target_y))return false;
        const target_square:square = board[target_y][target_x];
        return target_square===0 || target_square.color!==piece.color;
    }

    const good_dirs:dirs = dirs.filter(is_valid_dir);

    const squares:squaremove[] = good_dirs.map((dir)=>dir_to_square(piece.x, piece.y, dir, board));

    return squares;
}

function get_dir_qrb(color:color, old_x:number, old_y:number, board:boardDatas, dir:dir):squaremove[]{
    let squares:squaremove[] = [];
    for (let i=1;;i++){
        const x:number = old_x + dir[0]*i;
        const y:number = old_y + dir[1]*i;
        //outside the board
        if (!is_valid_square(x, y))break;

        const current_square = board[y][x];
        //piece of the same color
        if (current_square!==0 && current_square.color===color)break;

        squares.push({
            x: x,
            y: y,
            is_taking: board[y][x]!==0
        });
        //piece of the other color
        if (current_square!==0)break;
    }
    return squares;
}

//get the directions for the queen, the rook and the bishop
function get_dirs_qrb(piece:piece, board:boardDatas, dirs:dirs):squaremove[]{
    //get the coords ([x, y]) for each dir
    const squares:squaremove[][] = dirs.map((dir)=>get_dir_qrb(piece.color, piece.x, piece.y, board, dir));
    return squares.flat(1);
}

class Move{
    piece:string;
    x:number;
    y:number;
    target_x:number;
    target_y:number;
    is_taking:boolean;
    is_check:boolean;
    is_mate:boolean;
    is_draw:boolean;
    precision:string;
    promotion:string;
    constructor(piece:string, current_x:number, current_y:number, target_x:number, target_y:number, is_taking:boolean=false){
        this.piece = piece;
        this.x = current_x;
        this.y = current_y;
        this.target_x = target_x;
        this.target_y = target_y;
        this.is_taking = is_taking;
        this.is_check = false;
        this.is_mate = false;
        this.is_draw = false;
        this.precision = "";//if two piece of the same type can go on the same square
        this.promotion = "";
    }
    get_target_square():string{
        return get_square(this.target_x, this.target_y);
    }
    get_piece_notation():string{
        if (this.piece===piecetype.Pawn && !this.is_taking)return "";
        else if (this.piece===piecetype.Pawn)return COLUMNS[this.x];
        return this.piece;
    }
    get_notation_move():string{
        const piece:string = this.get_piece_notation();
        const precision:string = this.precision;
        const taking:string = this.is_taking ? "x" : "";
        const target_square:string = this.get_target_square();
        const promotion:string = this.promotion;
        const check:string = this.is_check ? "+" : "";
        const mate:string = this.is_mate ? "#" : "";
        //check if castle
        if (this.piece===piecetype.King && this.target_x===this.x-2){
            return "O-O-O"+check+mate;
        }else if (this.piece===piecetype.King && this.target_x===this.x+2){
            return "O-O"+check+mate;
        }
        return piece+precision+taking+target_square+promotion+check+mate;
    }
}

class Board implements board{
    board:boardDatas;
    moves:Move[];
    current_player:color;
    castles:castles;
    en_passant:string|undefined;
    halfmove_clock:number;
    fullmove_number:number;

    constructor(board?:boardDatas, moves?:Move[], current_player?:color, castles?:castles, en_passant?:string, halfmove_clock?:number, fullmove_number?:number){
        this.board = board || this.get_new_board();
        this.moves = moves || [];
        this.current_player = current_player || WHITE;
        this.castles = castles || {
            "white_kingside": true,
            "white_queenside": true,
            "black_kingside": true,
            "black_queenside": true
        };
        this.en_passant = en_passant;
        this.halfmove_clock = halfmove_clock || 0;
        this.fullmove_number = fullmove_number || 1;
    }

    get_board_copy():boardDatas{
        const new_board = this.board.map((line)=>{
            return line.map((square)=>{
                if (square===0)return square;
                switch (square.type){
                    case piecetype.Pawn:
                        return new Pawn(square.x, square.y, square.color);
                    case piecetype.King:
                        return new King(square.x, square.y, square.color);
                    case piecetype.Queen:
                        return new Queen(square.x, square.y, square.color);
                    case piecetype.Rook:
                        return new Rook(square.x, square.y, square.color);
                    case piecetype.Bishop:
                        return new Bishop(square.x, square.y, square.color);
                    case piecetype.Knight:
                        return new Knight(square.x, square.y, square.color);
                }
            })
        })
        return new_board;
    }

    get_copy():board{
        const board_datas:boardDatas = this.get_board_copy();
        const moves = this.moves.map((move)=>move);
        const player = this.current_player
        const castles = {
            "white_kingside": this.castles.white_kingside,
            "white_queenside": this.castles.white_queenside,
            "black_kingside": this.castles.black_kingside,
            "black_queenside": this.castles.black_queenside
        };
        const passant = this.en_passant;
        const halfmove = this.halfmove_clock;
        const fullmove = this.fullmove_number;
        return new Board(
            board_datas,
            moves,
            player,
            castles,
            passant,
            halfmove,
            fullmove
        );
    }

    see_board():void{
        for (let i:number=this.board.length-1;i>=0;i--){
            let text:string = "";
            const squares:square[] = this.board[i];
            for (const square of squares){
                if (square===0)text+=" ";
                else text+=square.type;
            }
            console.log(text);
        }
    }
    get_new_board():boardDatas{
        let board:boardDatas = Array.from(Array(8), ()=>Array(8).fill(0));

        let pieces:piece[] = [];
        //pawns
        for (let i:number=0;i<8;i++){
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

    get_every_moves(deep:number=0):Move[]{
        let moves:Move[] = [];
        for (const squares of this.board){
            for (const square of squares){
                if (square===0 || square.color!==this.current_player)continue;
                moves.push(...square.get_moves(this, square, this.moves, deep));
            }
        }

        let moves_hashtable:Record<string, Move[]> = {};
        for (const move of moves){
            const notation:string = move.get_notation_move();
            if (!moves_hashtable[notation])moves_hashtable[notation]=[move];
            else moves_hashtable[notation].push(move);
        }
        for (const [notation, moves] of Object.entries(moves_hashtable)) {
            if (moves.length<2)continue;
            for (let i=0;i<moves.length;i++){
                const move:Move = moves[i];
                let same_column:boolean = false;
                let same_line:boolean = false;
                for (let j=0;j<moves.length;j++){
                    if (j===i)continue;
                    if (move.x===moves[j].x)same_column=true;
                    if (move.y===moves[j].y)same_line=true;
                }
                if (same_line && same_column)move.precision=get_square(move.x, move.y);
                else if (same_column)move.precision=(move.y+1).toString();
                else move.precision=COLUMNS[move.x];
            }
        }
        return moves;
    }

    make_move(piece: piece, move: Move):void{
        //castle
        //king move
        if (piece.type==="K"){
            if (this.current_player===WHITE){
                this.castles.white_kingside = false;
                this.castles.white_queenside = false;
            }else if (this.current_player===BLACK){
                this.castles.black_kingside = false;
                this.castles.black_queenside = false;
            }
        }
        //h rook move
        else if (piece.type==="R" && move.x===7 && move.y===7*piece.color){
            if (this.current_player===WHITE){
                this.castles.white_kingside = false;
            }else if (this.current_player===BLACK){
                this.castles.black_kingside = false;
            }
        }
        //a rook move
        else if (piece.type==="R" && move.x===0 && move.y===7*piece.color){
            if (this.current_player===WHITE){
                this.castles.white_queenside = false;
            }else if (this.current_player===BLACK){
                this.castles.black_queenside = false;
            }
        }
        //take h rook
        if (move.target_x===7 && move.target_y===(7*piece.color+7)%14){
            if (this.current_player===WHITE){
                this.castles.black_kingside = false;
            }else if (this.current_player===BLACK){
                this.castles.white_kingside = false;
            }
        }
        //take a rook
        else if (move.target_x===0 && move.target_y===(7*piece.color+7)%14){
            if (this.current_player===WHITE){
                this.castles.black_queenside = false;
            }else if (this.current_player===BLACK){
                this.castles.white_queenside = false;
            }
        }
        //en-passant
        this.en_passant = undefined;
        if (piece.type==="P" && (move.y===1 && move.target_y===3 || move.y===6 && move.target_y===4)){
            this.en_passant = get_square(move.x, move.y===1 ? 2 : 5);
        }
        //50 moves rule
        this.halfmove_clock++;
        if (piece.type==="P" || move.is_taking){
            this.halfmove_clock = 0;
        }
        //full moves number
        if (piece.color===BLACK){
            this.fullmove_number++;
        }
        //update the board with the move
        this.board = piece.do_move(this.board, move, piece.edit_func);
        this.moves.push(move);
        //update player turn
        this.current_player = (this.current_player+1)%2 as color;
    }
    make_move_notation(piece: piece, notation: string):void{
        const every_moves:Move[] = this.get_every_moves();
        const moves = every_moves.filter((move)=>move.get_notation_move()===notation);
        if (moves.length===0)throw Error(`move: ${notation} not found in the position`);
        const move = moves[0];
        this.make_move(piece, move);
    }
}

class Piece implements piece{
    x:number;
    y:number;
    color:color;
    type:piecetype;
    edit_func(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move):square{
        return 0;
    };
    constructor(x:number, y:number, color:color, type:piecetype){
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
    }
    is_legal_move(origin_board:board, move:Move, moves:Move[], deep:number):boolean{
        let board:board = origin_board.get_copy();
        const piece:square = board.board[move.y][move.x];
        //check if there is a piece to move
        if (piece===0)return false;

        board.make_move(piece, move);

        const king:King = get_pieces(board.board ,(square:square)=>square!==0 && square.color===piece.color && square.type===piecetype.King)[0] as King;
        const other_king:King = get_pieces(board.board ,(square:square)=>square!==0 && square.color!==piece.color && square.type===piecetype.King)[0] as King;

        const is_legal:boolean = !king.is_in_check(board.board);
        if (!is_legal)return false;

        move.is_check = other_king.is_in_check(board.board);
        if (move.is_check && deep===0){
            if (board.get_every_moves(deep+1).length===0){
                move.is_check = false;
                move.is_mate = true;
            }
        }else if (deep===0){
            if (board.get_every_moves(deep+1).length===0){
                move.is_draw = true;
            }
        }
        return true;
    }
    do_move(board:boardDatas, move:Move, edit_func:Piece["edit_func"]):boardDatas{
        const piece:Piece = this;
        const new_board:boardDatas = board.map(function (squares, y){
            return squares.map(function (square, x){
                return edit_func(piece, square, x, y, board, move);
            });
        });
        return new_board;
    }
    get_moves(board:board, piece:piece, all_moves:Move[], deep:number=0){
        if (!piece.get_squares)throw Error("Board.mts: line 320: the object piece doesn't have the get_squares method");

        const squares:squaremove[] = piece.get_squares(board.board, piece);
        const moves:Move[] = squares.map((square)=>new Move(piece.type, piece.x, piece.y, square.x, square.y, square.is_taking));
        const legal_moves:Move[] = moves.filter((move)=>piece.is_legal_move(board, move, all_moves, deep));
        return legal_moves;
    }
}

class Pawn extends Piece implements piece{
    constructor(x:number, y:number, color:color){
        super(x, y, color, piecetype.Pawn);
    }
    edit_func(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move):square{
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y){
            if (move.promotion==="")return new Pawn(x, y, piece.color);
            switch (move.promotion[1]){
                case "Q":
                    return new Queen(x, y, piece.color);
                case "R":
                    return new Rook(x, y, piece.color);
                case "B":
                    return new Bishop(x, y, piece.color);
                case "N":
                    return new Knight(x, y, piece.color);
            }
        }
        //en-passant
        if (x===move.target_x && y===move.y && board[move.target_y][move.target_x]===0)return 0;

        return square;
    }
    check_promotion(piece_type:piecetype, piece_x:number, piece_y:number, x:number, y:number, is_taking:boolean):Move[]{
        if (y===7 || y===0){
            let promotions = ["=Q", "=R", "=N", "=B"];
            const moves = promotions.map(function (promotion){
                const move = new Move(piece_type, piece_x, piece_y, x, y, is_taking);
                move.promotion = promotion;
                return move;
            });
            return moves;
        }else {
            const moves = [new Move(piece_type, piece_x, piece_y, x, y, is_taking)];
            return moves;
        }
    }
    get_moves(board:board, piece:piece, all_moves:Move[], deep:number=0):Move[] {
        let moves = [];
        const x:number = piece.x;
        const y:number = piece.y;
        const direction:1|-1 = piece.color ? -1 : 1;
        //single and double push
        if (board.board[y+direction][x]===0){
            moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y+direction,false));
            if ((piece.color===WHITE && y===1 || piece.color===BLACK && y===6) && board.board[y+direction*2][x]===0){
                moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y+direction*2,false));
            }
        }
        //normal takes
        const xys:number[][] = [[x-1, y+direction], [x+1, y+direction]].filter((xy)=>is_valid_square(xy[0], xy[1]));
        for (const xy of xys){
            const x:number = xy[0];
            const y:number = xy[1];
            const square:square = board.board[y][x];

            if (square && square.color!==piece.color){
                moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y,true));
            }
        }
        //en-passant
        for (const move of [-1, 1]){
            const x:number = piece.x + move;
            const y:number = piece.y + direction;
            if (is_valid_square(x, y) && get_square(x, y)===board.en_passant){
                moves.push(...this.check_promotion(piece.type, piece.x, piece.y, x, y,true));
            }
        }
        const legal_moves:Move[] = moves.filter((move)=>piece.is_legal_move(board, move, all_moves, deep));
        return legal_moves;
    }
}
class King extends Piece implements piece{
    constructor(x:number, y:number, color:color){
        super(x, y, color, piecetype.King);
    }
    edit_func(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move):square{
        const is_castle_king:boolean = move.x-move.target_x===-2;
        const is_castle_queen:boolean = move.x-move.target_x===2;
        const rook_x:0|7 = is_castle_king ? 7 : 0;
        const new_rook_x:3|5 = is_castle_king ? 5 : 3;
        if ((is_castle_king || is_castle_queen) && y===move.y && x===rook_x)return 0;
        if ((is_castle_king || is_castle_queen) && y===move.y && x===new_rook_x){
            return new Rook(new_rook_x, y, piece.color);
        }

        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new King(x, y, piece.color);

        else return square;
    }
    get_moves(board:board, _:piece, all_moves:Move[], deep:number=0):Move[] {
        let piece:King = this;
        let moves:Move[] = [];
        const dirs:(-1|0|1)[] = [-1, 0, 1];
        for (const y_dir of dirs){
            for (const x_dir of dirs){
                const y:number = piece.y+y_dir;
                const x:number = piece.x+x_dir;
                if (!is_valid_square(x, y))continue;
                const move:Move = new Move(piece.type, piece.x, piece.y, x, y);
                const square:square = board.board[y][x];
                if (square===0 || square.color!==piece.color){
                    if (square!==0)move.is_taking=true;
                    moves.push(move);
                }
            }
        }
        //check kingside castle
        if (board.current_player===WHITE && board.castles.white_kingside || board.current_player===BLACK && board.castles.black_kingside){
            //check if (f1 and g1 || f8 and g8) are free
            if (board.board[piece.y][5]===board.board[piece.y][6] && board.board[piece.y][5]===0){
                //check if (f1 || f8) is controlled by an opponent piece
                if (piece.is_legal_move(board, new Move(piece.type, piece.x, piece.y, piece.x+1, piece.y), all_moves, deep)){
                    moves.push(new Move(piece.type, piece.x, piece.y, piece.x+2, piece.y, false));
                }
            }
        }
        //check queenside castle
        if (board.current_player===WHITE && board.castles.white_queenside || board.current_player===BLACK && board.castles.black_queenside){
            //check if (b1, c1 and d1 || b8, c8 and d8) are free
            if (board.board[piece.y][1]===board.board[piece.y][2] && board.board[piece.y][3]===0 && board.board[piece.y][1]===0){
                //check if (d1 || d8) is controlled by an opponent piece
                if (piece.is_legal_move(board, new Move(piece.type, piece.x, piece.y, piece.x-1, piece.y), all_moves, deep)){
                    moves.push(new Move(piece.type, piece.x, piece.y, piece.x-2, piece.y, false));
                }
            }
        }
        const legal_moves:Move[] = moves.filter((move)=>piece.is_legal_move(board, move, all_moves, deep));
        return legal_moves;
    }
    is_in_check(board:boardDatas){
        //check pawn
        const pawn_y:number = [1, -1][this.color];
        const pawn_dirs:number[][] = [[1, pawn_y], [-1, pawn_y]];
        const pawn_squares = pawn_dirs.map((dir)=>[this.x+dir[0], this.y+dir[1]]);
        const pawn_good_squares = pawn_squares.filter((square)=>is_valid_square(square[0],square[1]));

        for (const pawn_dir of pawn_good_squares){
            const x:number = pawn_dir[0];
            const y:number = pawn_dir[1];
            const square:square = board[y][x];
            if (square!==0 && square.type===piecetype.Pawn && square.color!==this.color)return true;
        }
        //rook
        const rook_dirs = [[1, 0], [-1, 0], [0, -1], [0, 1]];
        for (const rook_dir of rook_dirs){
            let y:number = this.y+rook_dir[0];
            let x:number = this.x+rook_dir[1];
            while (is_valid_square(x, y)){
                const square:square = board[y][x];
                if (square && square.color!==this.color && (square.type===piecetype.Rook || square.type===piecetype.Queen))return true;
                else if (square)break;
                y += rook_dir[0];
                x += rook_dir[1];
            }
        }
        //bishop
        const bishop_dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const bishop_dir of bishop_dirs){
            let y:number = this.y+bishop_dir[0];
            let x:number = this.x+bishop_dir[1];
            while (is_valid_square(x, y)){
                const square = board[y][x];
                if (square && square.color!==this.color && (square.type===piecetype.Bishop || square.type===piecetype.Queen))return true;
                else if (square)break;
                y += bishop_dir[0];
                x += bishop_dir[1];
            }
        }
        //knight
        const knight_dirs:dirs = [[-1, 2], [-1, -2], [1, 2], [1, -2],
                             [-2, 1], [-2, -1], [2, 1], [2, -1]];
        const knight_squares:dirs = knight_dirs.map((dir)=>[this.y+dir[0], this.x+dir[1]]);
        const knight_good_squares:number[][] = knight_squares.filter((dir)=>is_valid_square(dir[1],dir[0]));

        for (const knight_square of knight_good_squares){
            const y:number = knight_square[0];
            const x:number = knight_square[1];
            const square:square = board[y][x];
            if (square && square.color!==this.color && square.type===piecetype.Knight)return true;
        }
        //king
        const king_dirs = [-1, 0, 1];
        for (const dir1 of king_dirs){
            for (const dir2 of king_dirs){
                const y:number = this.y+dir1;
                const x:number = this.x+dir2;
                if (!is_valid_square(x, y))continue;
                const square:square = board[y][x];
                if (square && square.color!==this.color && square.type===piecetype.King)return true;
            }
        }
        return false;
    }
}
class Bishop extends Piece implements piece{
    constructor(x:number, y:number, color:color){
        super(x, y, color, piecetype.Bishop);
    }
    edit_func(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move):square{
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Bishop(x, y, piece.color);
        else return square;
    }
    get_squares(board:boardDatas, piece:piece):squaremove[]{
        const dirs:(1|-1)[][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        return get_dirs_qrb(piece, board, dirs);
    }
}
class Rook extends Piece {
    constructor(x:number, y:number, color:color){
        super(x, y, color, piecetype.Rook);
    }
    edit_func(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move):square{
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Rook(x, y, piece.color);
        else return square;
    }
    get_squares(board:boardDatas, piece:piece):squaremove[]{
        const dirs:(0|1|-1)[][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        return get_dirs_qrb(piece, board, dirs);
    }
}
class Knight extends Piece {
    constructor(x:number, y:number, color:color){
        super(x, y, color, piecetype.Knight);
    }
    edit_func(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move):square{
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Knight(x, y, piece.color);
        else return square;
    }
    get_squares(board:boardDatas, piece:piece):squaremove[]{
        const dirs:number[][] = [[ 2,  1], [ 2, -1],
                        [-2, -1], [-2,  1],
                        [ 1,  2], [-1,  2],
                        [ 1, -2], [-1, -2]];
        return get_dirs_knight_king(piece, board, dirs);
    }
    
}
class Queen extends Piece {
    constructor(x:number, y:number, color:color){
        super(x, y, color, piecetype.Queen);
    }
    edit_func(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move):square{
        if (piece===square)return 0;
        if (x===move.target_x && y===move.target_y)return new Queen(x, y, piece.color);
        else return square;
    }
    get_squares(board:boardDatas, piece:piece):squaremove[]{
        const dirs:(0|1|-1)[][] = [[1, 0], [0, 1], [-1, 0], [0, -1],//rook
                      [1, 1], [1, -1], [-1, 1], [-1, -1]];//bishop
        return get_dirs_qrb(piece, board, dirs);
    }
}
export { Board, Pawn, King, Bishop, Rook, Knight, Queen, WHITE, BLACK, get_square};