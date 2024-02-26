const Board = require("./js_modules/Board");

function show_moves(moves){
    for (const move of moves){
        console.log(move.get_notation_move());
    }
}

function get_moves_by_notation(notation, moves){
    for (const move of moves){
        if (notation===move.get_notation_move()){
            return move;
        }
    }
}

function do_move(notation, board){
    const moves = board.get_every_moves();
    const move = get_moves_by_notation(notation, moves);
    const piece = board.board[move.y][move.x];
    board.board = piece.do_move(board.board, move, piece.edit_func);
    board.moves.push(move);
}

function do_moves(notations, board, show_board=false){
    for (const notation of notations){
        do_move(notation, board);
        if (show_board){
            board.see_board();
            console.log("");
        }
    }
}

function do_random_move(board){
    const moves = board.get_every_moves();
    const move = moves[Math.floor(Math.random()*moves.length)];
    const piece = board.board[move.y][move.x];
    board.board = piece.do_move(board.board, move, piece.edit_func);
    board.moves.push(move);
    return move;
}

function random_game(board, nb_times){
    for (let i=0;i<nb_times;i++){
        const move = do_random_move(board);
        console.log(move.get_notation_move());
        if (move.is_mate){
            console.log("game finished, victory for "+(move.color ? "black" : "white"));
            return 1;
        }else if (move.is_draw){
            console.log("draw");
            return 0;
        }
    }
    return 2;
}

let board = new Board.Board();
result = random_game(board, 300);