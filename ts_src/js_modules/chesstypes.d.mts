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
    is_legal_move:(board:Board, move:Move, moves:Move[], deep:number)=>boolean;
    edit_func:(piece:piece, square:square, x:number, y:number, board:boardDatas, move:Move)=>square;
    do_move:(board:boardDatas, move:Move, edit_func:piece["edit_func"])=>boardDatas;
    get_moves:(board:Board, piece:piece, all_moves:Move[], deep:number)=>Move[];
    get_squares?:(board:boardDatas, piece:piece)=>squaremove[];
}

export { square, boardDatas, color, dir, dirs, piecetype, castles, squaremove, piece };