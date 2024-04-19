import { square, boardDatas, color, dir, dirs, piecetype, castles, squaremove, piece } from "./chesstypes.mjs"

import * as Game from "./Board.mjs";

const WHITE:color = 0;
const BLACK:color = 1;

function get_placement_data(board:boardDatas):string{
    let result:string = "";
    for (let i=7;i>=0;i--){
        let pawn_counter:number = 0;
        for (let j=0;j<8;j++){
            const square:square = board[i][j];
            let type:string="";
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

function get_active_color(current_player:color):string{
    return current_player===WHITE ? "w" : "b";
}

function get_castling(castles:castles):string{
    let result = "";
    //white
    result+=castles.white_kingside ? "K" : "";
    result+=castles.white_queenside ? "Q" : "";
    //black
    result+=castles.black_kingside ? "k" : "";
    result+=castles.black_queenside ? "q" : "";
    return result || "-";
}

function get_fen(game:Game.Board):string{
    const placement_data = get_placement_data(game.board);
    const active_color = get_active_color(game.current_player);
    const castling = get_castling(game.castles);
    const en_passant = game.en_passant;
    const halfmove_clock = game.halfmove_clock;
    const full_move_number = game.fullmove_number;
    return placement_data+" "+active_color+" "+castling+" "+en_passant+" "+halfmove_clock+" "+full_move_number;
}


export { get_fen };