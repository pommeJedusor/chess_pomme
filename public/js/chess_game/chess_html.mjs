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
    const chessboard_sens = sessionStorage.getItem("chessboard_sens") ?? 1;
    const sens_move = chessboard_sens==="1" ? 1 : -1;
    const piece = get_html_piece(start_x, start_y);
    const piece_to_take = get_html_piece(target_x, target_y);
    const square = get_html_square(target_x, target_y);
    const width_squares = get_width_squares();
    const trans_x = ((target_x-start_x)*width_squares*sens_move).toString()+"px";
    const trans_y = ((-target_y+start_y)*width_squares*sens_move).toString()+"px";
    piece.style.transitionDuration = "300ms";
    piece.style.transform = "translate("+trans_x+", "+trans_y+")";
    setTimeout(function (){
        if (piece_to_take)piece_to_take.remove();
        square.insertAdjacentElement("beforeend", piece);
        piece.style.transform = "translate(0, 0)";
        piece.style.transitionDuration = "0ms";
    }, 300);
}

function insert_move(move_notation){
    const moves = document.querySelector("#moves");
    let move_div = document.createElement('div');
    let move_p = document.createElement('p');

    move_div.classList.add("move");
    if (moves.childElementCount%2===0)move_p.textContent = (moves.childElementCount/2+1).toString()+". ";
    move_p.textContent += move_notation;
    move_div.insertAdjacentElement("beforeend", move_p);

    moves.insertAdjacentElement("beforeend", move_div);
    moves.scrollBy(0, 10000);
}

function get_width_squares(){
    return document.querySelector(".square").getBoundingClientRect().width;
}

function close_end_message(){
    const alert_message = document.querySelector("#alert-message");
    if (alert_message)alert_message.remove();
}

function remove_draw_proposal(){
    const buttons = document.querySelector("#draw-buttons");
    if (!buttons)return false;
    buttons.remove();
    return true;
}

function update_board_sens(sens){
    const chessboard_sens = sens ?? sessionStorage.getItem("chessboard_sens");

    let chessboard = document.querySelector("#chessboard");
    const ranks = chessboard.querySelectorAll(".rank");
    const order_sens = chessboard_sens!=1 ? -1 : 1;

    ranks.forEach((rank, i)=>{
        rank.style.order = i*order_sens;
        const squares = rank.querySelectorAll(".square");
        squares.forEach((square, j)=>{
            square.style.order = j*order_sens;
        });
    });

    //timers
    const timer1 = document.querySelector("#timer1");
    const timer2 = document.querySelector("#timer2");
    const oppenent = document.querySelector("#opponent-infos");
    const user = document.querySelector("#user-infos");
    if (chessboard_sens===1){
        user.insertAdjacentElement("beforeend", timer1);
        oppenent.insertAdjacentElement("beforeend", timer2);
    }else{
        user.insertAdjacentElement("beforeend", timer2);
        oppenent.insertAdjacentElement("beforeend", timer1);
    }
}

function invert_board(){
    const chessboard_sens = sessionStorage.getItem("chessboard_sens") ?? 1;
    sessionStorage.setItem("chessboard_sens", chessboard_sens%2+1);
    update_board_sens();
}

function reset_red_squares(events_listeners){
    for (const event of events_listeners){
        event[0].removeEventListener("click", event[1]);
        if (!event[0].classList.contains("to_move")){
            //if square not given
            if (event.length===1)continue;
            event[2].classList.remove("to_move")
        }else{
            event[0].classList.remove("to_move");
        }
    }
    events_listeners.splice(0); 
}

//makes changes on the html board for special moves (castle, promotion, en-passant)
function special_change(the_move, piece_to_move, data_board){
        const notation_move = the_move.get_notation_move();
        //castle
        if (/^O-O(-O)?[#+]?$/.test(notation_move)){
            const y = data_board.moves.length%2===0 ? 0 : 7;
            const x = /O-O-O/.test(notation_move) ? 0 : 7;
            const target_x = x===0 ? 3 : 5;
            move_piece(x, y, target_x, y);
        }else if (the_move.piece==="P" && (the_move.target_y===7 || the_move.target_y===0)){
            piece_to_move.classList.remove("pawn");
            const type_pieces = ["Q", "R", "B", "N"];
            const class_pieces = ["queen", "rook", "bishop", "knight"];
            piece_to_move.classList.add(class_pieces[type_pieces.indexOf(the_move.promotion[1])]);
        }else if (the_move.piece==="P" && the_move.is_taking && data_board.board[the_move.target_y][the_move.target_x]===0){
            //if en-passant
            get_html_piece(the_move.target_x, the_move.y).remove();
        }
}

export { get_html_square, get_html_piece, get_xy_from_piece, move_piece, insert_move,
         get_width_squares, close_end_message, remove_draw_proposal, invert_board,
         update_board_sens, reset_red_squares, special_change };