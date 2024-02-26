import * as Game from "./Board.mjs";

const WHITE = 0;
const BLACK = 1;

function get_placement_data(board){
    let result = "";
    for (let i=7;i>=0;i--){
        let pawn_counter = 0;
        for (let j=0;j<8;j++){
            const square = board[i][j];
            let type="";
            if (square && pawn_counter){
                result+=pawn_counter;
                pawn_counter=0;
            }
            if (!square)pawn_counter++;
            else {
                type=square.type;
                if (square.color===BLACK)type = type.toLowerCase();
            }
            result+=type;
        }
        if (pawn_counter)result+=pawn_counter;
        result+="/";
    }
    return result;
}

function get_active_color(moves){
    return moves.length%2 ? "b" : "w";
}

function get_castling(game){
    let castling = [[true, true], [true, true]];
    const ys = [0, 7];

    for (const color of [WHITE, BLACK]){
        if (Game.check_move_append(game.moves, /^[KO]/, color))castling[color] = [false, false];

        const king_y = ys[color];
        const pattern_kingside = new RegExp("^Rh?"+king_y+"?(h[1-8](?<!"+king_y+")|[fg]"+king_y+")$");
        if (Game.check_move_append(game.moves, pattern_kingside, color)){
            castling[color][0] = false;
        }
        const pattern_queenside = new RegExp("^Ra?"+king_y+"?(a[1-8](?<!"+king_y+")|[bcd]"+king_y+")$");
        if (Game.check_move_append(game.moves, pattern_queenside, color)){
            castling[color][1] = false;
        }
    }
    let result = "";
    result+=castling[0][0] ? "K" : "";
    result+=castling[0][1] ? "Q" : "";
    result+=castling[1][0] ? "k" : "";
    result+=castling[1][1] ? "q" : "";
    result = result ? result : "-";
    return result;
}

function get_en_passant(moves){
    if (moves.length===0)return "-";
    const last_move = moves.at(-1);
    if (last_move.type==="P" && ((last_move.y===1 && last_move.target_y===3) | (last_move.y===6 && last_move.target_y===4))){
        const y = last_move.y===1 ? 2 : 5;
        return Game.get_square(last_move.x, y);
    }
    return "-";
}

function get_halfmove_clock(moves){
    let counter = 0;
    for (let i=moves.length-1;i>=0;i--){
        if (moves[i].is_taking || moves[i].piece==="P")break
        counter++;
    }
    return counter;
}

function get_full_move_number(moves_number){
    const pair_move_number = moves_number-moves_number%2;
    const full_move_number = pair_move_number/2+1;
    return full_move_number;
}

function get_fen(game){
    const placement_data = get_placement_data(game.board);
    const active_color = get_active_color(game.moves);
    const castling = get_castling(game);
    const en_passant = get_en_passant(game.moves);
    const halfmove_clock = get_halfmove_clock(game.moves);
    const full_move_number = get_full_move_number(game.moves.length);
    return placement_data+" "+active_color+" "+castling+" "+en_passant+" "+halfmove_clock+" "+full_move_number;
}


export { get_fen };