export type pomme = number;
export type square = piece | 0;
export type boardDatas = square[][];
export type color = 0|1
export type dir = number[];
export type dirs = dir[];

export interface castles{
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

export interface move{
    readonly piece:string;
    readonly x:number;
    readonly y:number;
    readonly target_x:number;
    readonly target_y:number;
    is_taking:boolean;
    is_check:boolean;
    is_mate:boolean;
    is_draw:boolean;
    precision:string;
    promotion:string;
    get_notation_move:()=>string;
}

export interface board{
    board:boardDatas;
    moves:move[];
    current_player:color;
    castles:castles;
    en_passant:string|undefined;
    halfmove_clock:number;
    fullmove_number:number;
    see_board:()=>void;
    get_every_moves:(deep:number)=>move[];
    make_move:(piece: piece, move: move)=>void;
    make_move_notation:(piece: piece, notation: string)=>void;
    get_copy:()=>board;
}

export interface piece {
    x:number;
    y:number;
    color:color;
    type:piecetype;
    is_legal_move:(board:board, move:move, moves:move[], deep:number)=>boolean;
    edit_func:(piece:piece, square:square, x:number, y:number, board:boardDatas, move:move)=>square;
    do_move:(board:boardDatas, move:move, edit_func:piece["edit_func"])=>boardDatas;
    get_moves:(board:board, piece:piece, all_moves:move[], deep:number)=>move[];
    get_squares?:(board:boardDatas, piece:piece)=>squaremove[];
}

export interface game {
    player_1:Player;
    player_2:Player|undefined;
    id:number;
    board:board;
    moves:Move[];
    result:string|null;
    timestamp;//ms
    play:(move:string, filter_good_move:(m:move)=>boolean)=>boolean;
    finish:(winner:Player, message:string)=>void;
    close:(id_games:(game|undefined), socket_games:(game|undefined)[], sockets:(WebSocket|undefined)[])=>void;
    check_timeout:()=>void;
    get_pgn:()=>string;
}