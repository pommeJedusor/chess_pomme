import * as Board from "./js_modules/Board.mjs";

function get_random_move(moves){
    const random_index = Math.floor(Math.random()*moves.length);
    return moves[random_index];
}
function show_moves(moves){
    for (const move of moves){
        console.log(move.get_notation_move());
    }
}
function play_random_moves(nb_times, board, last_move="", times=0){
    const moves = board.get_every_moves();
    const move = get_random_move(moves);
    const piece = board.board[move.y][move.x];
    const notation_move = move.get_notation_move();
    if (times%2!==0)console.log(Math.ceil(times/2).toString()+"."+last_move+" "+notation_move);
    if (nb_times===times)return;
    //play the move
    //piece.move(board.board, move.target_x, move.target_y);
    board.board = piece.do_move(board.board, move, piece.edit_func);
    board.moves.push(move);
    play_random_moves(nb_times, board, notation_move, times+1);
}
function get_move_list(moves, move){
    for (const m of moves){
        if (m.get_notation_move()===move)return m;
    }
    return false;
}
function play_moves(board, list_moves, deep=0){
    if (list_moves.length<=deep)return;
    const moves = board.get_every_moves();
    const move = get_move_list(moves, list_moves[deep]);
    if (move===false){console.log("coup non trouvé");return;}
    const piece = board.board[move.y][move.x];
    console.log(list_moves[deep]);
    board.moves.push(move);
    board.board = piece.do_move(board.board, move, piece.edit_func);
    board.see_board();
    play_moves(board, list_moves, deep+1);
}
let board = new Board.Board();
console.log(board.get_every_moves());
play_random_moves(100, board);