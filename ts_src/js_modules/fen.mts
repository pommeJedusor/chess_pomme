import { boardDatas, castles, color, square } from "../types";

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
    let result:string = "";
    //white
    result+=castles.white_kingside ? "K" : "";
    result+=castles.white_queenside ? "Q" : "";
    //black
    result+=castles.black_kingside ? "k" : "";
    result+=castles.black_queenside ? "q" : "";
    return result || "-";
}

function get_fen(game:Game.Board):string{
    const placement_data:string = get_placement_data(game.board);
    const active_color:string = get_active_color(game.current_player);
    const castling:string = get_castling(game.castles);
    const en_passant:string = game.en_passant || "-";
    const halfmove_clock:string = game.halfmove_clock.toString();
    const full_move_number:string = game.fullmove_number.toString();
    return placement_data+" "+active_color+" "+castling+" "+en_passant+" "+halfmove_clock+" "+full_move_number;
}


export { get_fen };