import * as chess_html from "./chess_html.mjs";

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
    close_button.addEventListener("click", chess_html.close_end_message);

    alert_div.insertAdjacentElement("afterbegin", result_h3);
    alert_div.insertAdjacentElement("beforeend", reason_message);
    alert_div.insertAdjacentElement("beforeend", close_button);
    chessboard_div.insertAdjacentElement("beforeend", alert_div);
}

function insert_draw_proposal(ws, username="Anonyme"){
    //message
    insert_message(username, "vous propose match nulle", " ");
    //button accept
    let validate_button = document.createElement("button");
    validate_button.id = "accept-draw";
    validate_button.addEventListener("click", function (){
        ws.send("DA");
        chess_html.remove_draw_proposal();
        return
    });
    //button decline
    let decline_button = document.createElement("button");
    decline_button.id = "decline-draw";
    decline_button.addEventListener("click", function (){
        ws.send("DD");
        chess_html.remove_draw_proposal();
        return
    });
    //insert buttons
    let buttons = document.createElement("div")
    buttons.id = "draw-buttons";
    buttons.insertAdjacentElement("afterbegin", decline_button);
    buttons.insertAdjacentElement("afterbegin", validate_button);
    const messages = document.querySelector("#messages");
    messages.insertAdjacentElement("beforeend", buttons);
    messages.scrollBy(0, 10000);
}

function insert_rematch_proposal(ws, username="Anonyme"){
    //message
    insert_message(username, "vous propose une revanche", " ");
    //button accept
    let validate_button = document.createElement("button");
    validate_button.id = "accept-draw";
    validate_button.addEventListener("click", function (){
        ws.send("RP:");
        //chess_html.remove_rematch_proposal();
        return
    });
    //button decline
    let decline_button = document.createElement("button");
    decline_button.id = "decline-draw";
    decline_button.addEventListener("click", function (){
        ws.send("RD:");
        //chess_html.remove_rematch_proposal();
        return
    });
    //insert buttons
    let buttons = document.createElement("div")
    buttons.id = "draw-buttons";
    buttons.insertAdjacentElement("afterbegin", decline_button);
    buttons.insertAdjacentElement("afterbegin", validate_button);
    const messages = document.querySelector("#messages");
    messages.insertAdjacentElement("beforeend", buttons);
    messages.scrollBy(0, 10000);
}

function insert_message(username, message, separator=" : "){
    //message
    let message_p = document.createElement("p");
    message_p.classList.add("message");
    message_p.textContent = message;
    //username
    if (username){
        let user_span = document.createElement("span")
        user_span.classList.add("user-name");
        user_span.textContent = username+separator;
        message_p.insertAdjacentElement("afterbegin", user_span);
    }
    //insert
    const messages = document.querySelector("#messages");
    messages.insertAdjacentElement("beforeend", message_p);
    messages.scrollBy(0, 10000);
}

//when recieve move
function make_move(data_board, notation_move, events_listeners, player_number, animation_delay=undefined){
    chess_html.insert_move(notation_move);
    chess_html.reset_red_squares(events_listeners);
    //get the move
    let the_move;
    for (const move of data_board.get_every_moves()){
        if (move.get_notation_move()===notation_move){
            the_move=move;
            break;
        }
    }
    if (!the_move){
        console.log("move : "+notation_move+" non trouvé")
        console.log(data_board.get_every_moves().map(move=>move.get_notation_move()));
        console.log(data_board);
        return;
    }
    //make the html move
    chess_html.move_piece(the_move.x, the_move.y, the_move.target_x, the_move.target_y, player_number, animation_delay);
    chess_html.special_change(the_move, chess_html.get_html_piece(the_move.x, the_move.y), data_board);
    //make the move in the datas
    const piece = data_board.board[the_move.y][the_move.x];
    data_board.make_move(piece, the_move);
}

function switch_moves_buttons(ws){
    const buttons = document.querySelector("#moves-buttons");
    const resign_button = document.querySelector("#resign-button");
    if (resign_button){
        //remove previous buttons
        const draw_button = document.querySelector("#draw-button");
        resign_button.remove();
        draw_button.remove();
        //make the new buttons
        const rematch_button = document.createElement("button");
        const new_game_button = document.createElement("button");
        rematch_button.id = "rematch-button";
        new_game_button.id = "new-game-button";
        rematch_button.textContent = "Proposer une revanche";
        new_game_button.textContent = "lancer une nouvelle partie";
        //insert them
        buttons.insertAdjacentElement("beforeend", rematch_button);
        buttons.insertAdjacentElement("beforeend", new_game_button);
    }
    else {
        //remove previous buttons
        const rematch_button = document.querySelector("#rematch-button");
        const new_game_button = document.querySelector("#new-game-button");
        rematch_button.remove();
        new_game_button.remove();
        //make the new buttons
        const resign_button = document.createElement("button");
        const draw_button = document.createElement("button");
        resign_button.id = "resign-button";
        draw_button.id = "draw-button";
        resign_button.textContent = "Abandonner";
        draw_button.textContent = "Proposer nulle";
        //insert them
        buttons.insertAdjacentElement("beforeend", resign_button);
        buttons.insertAdjacentElement("beforeend", draw_button);
    }
    chess_html.event_moves_buttons(ws);
}

export { insert_end_message, insert_draw_proposal, make_move, insert_message, switch_moves_buttons, insert_rematch_proposal };
