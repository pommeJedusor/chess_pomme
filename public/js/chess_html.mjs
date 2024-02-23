function get_html_square(x, y){
    const ranks = document.querySelectorAll("#chessboard > div");
    const rank = ranks[ranks.length-y-1];
    const squares = rank.querySelectorAll(".square");
    const square = squares[x];
    return square;
}

function get_html_piece(x, y){
    const square = get_html_square(x, y);
    const piece = square.querySelector(".piece");
    return piece;
}

function get_xy_from_piece(piece){
    const x = piece.parentElement.classList[1];
    const y = piece.parentElement.parentElement.classList[1];
    return [x, y];
}

function move_piece(start_x, start_y, target_x , target_y, player_number){
    const piece = get_html_piece(start_x, start_y);
    const piece_to_take = get_html_piece(target_x, target_y);
    const square = get_html_square(target_x, target_y);
    const trans_x = ((target_x-start_x)*100).toString()+"px";
    const trans_y = ((-target_y+start_y)*100).toString()+"px";
    piece.style.transitionDuration = "300ms";
    console.log(trans_x, trans_y)
    piece.style.transform = "translate("+trans_x+", "+trans_y+")";
    setTimeout(function (){
        if (piece_to_take)piece_to_take.remove();
        square.insertAdjacentElement("beforeend", piece);
        piece.style.transform = "translate(0, 0)";
        piece.style.transitionDuration = "0ms";
    }, 300);
}

function instant_move_piece(piece, piece_pos, target_x, target_y){
    const origin_x = piece_pos.x+50;
    const origin_y = piece_pos.y+50;
    const x = target_x - origin_x;
    const y = target_y - origin_y;
    const style = "translate("+x+"px,"+y+"px)";
    piece.style.transform = style;
}

export { get_html_square, get_html_piece, get_xy_from_piece, move_piece, instant_move_piece };