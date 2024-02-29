import * as html_chess from "./chess_html.mjs";

function instant_move_piece(piece, piece_pos, target_x, target_y){
    const width_squares = html_chess.get_width_squares();
    const origin_x = piece_pos.x+width_squares/2;
    const origin_y = piece_pos.y+width_squares/2;
    const x = target_x - origin_x;
    const y = target_y - origin_y;
    const style = "translate("+x+"px,"+y+"px)";
    piece.style.transform = style;
}

export { instant_move_piece };