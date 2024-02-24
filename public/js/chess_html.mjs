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
    const width_squares = get_width_squares();
    const trans_x = ((target_x-start_x)*width_squares).toString()+"px";
    const trans_y = ((-target_y+start_y)*width_squares).toString()+"px";
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
    const width_squares = get_width_squares();
    const origin_x = piece_pos.x+width_squares/2;
    const origin_y = piece_pos.y+width_squares/2;
    const x = target_x - origin_x;
    const y = target_y - origin_y;
    const style = "translate("+x+"px,"+y+"px)";
    piece.style.transform = style;
}

function insert_move(move_notation){
    const moves = document.querySelector("#moves");
    let move_div = document.createElement('div');
    let move_p = document.createElement('p');

    move_div.classList.add("move");
    console.log(move_div.childElementCount);
    if (moves.childElementCount%2===0)move_p.textContent = (moves.childElementCount/2+1).toString()+". ";
    move_p.textContent += move_notation;
    move_div.insertAdjacentElement("beforeend", move_p);

    moves.insertAdjacentElement("beforeend", move_div);
    moves.scrollBy(0, 10000);
}

function insert_message(username, message){
    //message
    let message_p = document.createElement("p");
    message_p.classList.add("message");
    message_p.textContent = message;
    //username
    if (username){
        let user_span = document.createElement("span")
        user_span.classList.add("user-name");
        user_span.textContent = username+" : ";
        message_p.insertAdjacentElement("afterbegin", user_span);
    }
    //insert
    const messages = document.querySelector("#messages");
    messages.insertAdjacentElement("beforeend", message_p);
    messages.scrollBy(0, 10000);
}

function get_width_squares(){
    return document.querySelector(".square").getBoundingClientRect().width;
}

function insert_end_message(result, reason){
    let result_message;
    if (result===1)result_message = "VOUS AVEZ GAGNÉ";
    else if (result===-1)result_message = "VOUS AVEZ PERDU";
    else result_message = "MATCH NULLE";
    const chessboard_div = document.querySelector("#chessboard");
    let alert_div = document.createElement("div");
    alert_div.id = "alert-message";
    if (result===1)alert_div.classList.add("win");
    else if (result===-1)alert_div.classList.add("lose");
    else alert_div.classList.add("draw");
    //if draw win or lose
    let result_h3 = document.createElement("h3");
    alert_div.classList.add("result-message");
    result_h3.textContent = result_message;
    //why he lost won or draw
    let reason_message = document.createElement("p");
    alert_div.classList.add("reason-message");
    reason_message.textContent = reason;
    //button to close
    let close_button = document.createElement("button");
    close_button.id = "close-button";
    close_button.addEventListener("click", close_end_message);

    alert_div.insertAdjacentElement("afterbegin", result_h3);
    alert_div.insertAdjacentElement("beforeend", reason_message);
    alert_div.insertAdjacentElement("beforeend", close_button);
    chessboard_div.insertAdjacentElement("beforeend", alert_div);
}

function close_end_message(){
    const alert_message = document.querySelector("#alert-message");
    if (alert_message)alert_message.remove();
}

export { get_html_square, get_html_piece, get_xy_from_piece, move_piece, instant_move_piece, insert_move,
         insert_message, get_width_squares, insert_end_message, close_end_message };