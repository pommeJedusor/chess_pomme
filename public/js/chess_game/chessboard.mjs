import * as html_chess from "./chess_html.mjs";
import * as html_chessboard from "./chessboard_html.mjs";

const WHITE = 0;
const BLACK = 1;
let cursor_x = 0;
let cursor_y = 0;
let player_number = [];
let events_listeners = [];

function moveMouse(e){
    cursor_x = e.pageX;
    cursor_y = e.pageY;
}
let messageSend = null;

function no_drag_move(event, ws, piece, animation_piece_cursor, data_board){
    console.log("player_number")
    console.log(player_number)
    html_chess.reset_red_squares(events_listeners);
    //other player's turn
    if (data_board.moves.length%2===player_number[0]%2){
        if (piece)piece.style.transform=null;
        clearInterval(animation_piece_cursor);
        return;
    }
    //get the potentials moves for the piece
    const xy = html_chess.get_xy_from_piece(piece)
    const x = Number(xy[0]);
    const y = Number(xy[1]);
    const moves = data_board.get_every_moves();
    let squares_to_edit = [];
    for (const move of moves){
        if (move.x===x && move.y===y)squares_to_edit.push({
            "square":html_chess.get_html_square(move.target_x, move.target_y),
            "piece":html_chess.get_html_piece(move.target_x, move.target_y),
            "move":move
        });
    }
    //edit the target squares
    for (const square_move of squares_to_edit){
        const square = square_move["square"];
        const piece_move = square_move["piece"];
        const move = square_move["move"];
        square.classList.add("to_move");
        function a(){
            //red squares
            html_chess.reset_red_squares(events_listeners);
            //insert move notation and remove draw proposal
            html_chess.insert_move(move.get_notation_move());
            html_chess.remove_draw_proposal();
            //move the piece(s)
            html_chess.special_change(move, piece, data_board);
            html_chess.move_piece(move.x, move.y, move.target_x, move.target_y, player_number[0]);
            //update datas board
            const data_piece = data_board.board[move.y][move.x];
            data_board.make_move(data_piece, move);
            //send move to server
            ws.send(move.get_notation_move());
            clearInterval(animation_piece_cursor);
        }
        if (!player_number[0])continue;
        if (piece_move){
            events_listeners.push([piece_move, a, square]);
            piece_move.addEventListener("click", a);
        }
        else {
            events_listeners.push([square, a]);
            square.addEventListener("click", a);
        }
    }
    piece.style.transform = "";
    clearInterval(animation_piece_cursor);
}

function drop(event, ws, piece_origin_pos, piece, mouseup_event, animation_piece_cursor, data_board) {
    document.removeEventListener("mouseup", mouseup_event);
    if (!piece)return;
    event.preventDefault();
    const old_x = Number(piece.parentElement.classList[1]);
    const old_y = Number(piece.parentElement.parentElement.classList[1]);
    const origin_x = piece_origin_pos.x;
    const origin_y = piece_origin_pos.y;
    const width_squares = html_chess.get_width_squares();
    const chessboard_sens = sessionStorage.getItem("chessboard_sens")!=1 ? -1 : 1;
    const dif_x = Math.floor((cursor_x - origin_x)/width_squares)*chessboard_sens;
    const dif_y = Math.floor((cursor_y - origin_y)/width_squares)*chessboard_sens;
    const new_x = old_x + dif_x;
    const new_y = old_y - dif_y;

    //if the move check with one which is legal
    if (!data_board.get_every_moves().filter((move)=>move.x===old_x && move.y===old_y && move.target_x===new_x && move.target_y===new_y)){
        html_chess.reset_red_squares(events_listeners);
    }

    if (new_x===old_x && new_y===old_y)return setTimeout(function(){
        no_drag_move(event, ws, piece, animation_piece_cursor, data_board);//if drop on the same square
    },10);//put a delay to let the event listener start before trying to remove them

    //get the move played
    const all_moves = data_board.get_every_moves();
    let move_found = null;
    for (const move of all_moves){
        if (move.x===old_x && move.y===old_y && move.target_x===new_x && move.target_y===new_y){
            if (["=R", "=B", "=N"].includes(move.promotion))continue;
            move_found = move;
        }
    }
    //if move found and is player's turn
    if (move_found!==null && (player_number[0] && player_number[0]%2!==data_board.moves.length%2)){
        //html
        html_chess.insert_move(move_found.get_notation_move());
        html_chess.reset_red_squares(events_listeners);
        const square = html_chess.get_html_square(new_x, new_y)
        square.innerHTML = "";
        square.insertAdjacentElement("beforeend", piece);
        html_chess.special_change(move_found, piece, data_board)
        //datas
        const data_piece = data_board.board[old_y][old_x];
        data_board.make_move(data_piece, move_found);
        ws.send(move_found.get_notation_move());
        html_chess.remove_draw_proposal();
    }
    piece.style.transform = "";
    clearInterval(animation_piece_cursor);
}

//make the html board and init all the event listeners
function make_board(board, data_board, ws){
    //reset board if there was one
    board.innerHTML = "";
    const moves = document.querySelector("#moves");
    if (moves)moves.innerHTML = "";
    const messages = document.querySelector("#messages");
    if (messages)messages.innerHTML = "";

    const NB_RANKS = 8;
    const NB_FILES = 8;
    for (let i=NB_RANKS-1;i>=0;i--){
        const rank = document.createElement("div");
        rank.classList.add("rank", i);
        for (let j=0;j<NB_FILES;j++){
            const square = document.createElement("div");
            square.ondragover = "event.preventDefault();";
            square.classList.add("square", j);

            rank.insertAdjacentElement('beforeend', square);
        }
        board.insertAdjacentElement('beforeend', rank);
    }
    //pieces
    const piece_set = html_chess.get_piece_set();
    for (let y=0;y<8;y++){
        for (let x=0;x<8;x++){
            //add the piece
            const square = data_board.board[y][x];
            if (!square)continue;
            const piece = document.createElement("div");
            piece.classList.add("piece");
            //add the piece svg
            const piece_color = square.color===WHITE ? "b" : "w";
            const piece_img = document.createElement("img");
            piece_img.src = `./piece/${piece_set}/${piece_color}${square.type}.svg`;
            piece.insertAdjacentElement("beforeend", piece_img);
            //y is invered in the data_board
            piece.draggable = true;
            piece.addEventListener("mousedown", function (e){
                const piece_origin_pos = piece.getBoundingClientRect();
                const animation_piece_cursor = setInterval(()=>html_chessboard.instant_move_piece(piece, piece_origin_pos, cursor_x, cursor_y),10)
                e.preventDefault();
                document.addEventListener("mouseup", function mouseup_event(e){
                    drop(e, ws, piece_origin_pos, piece, mouseup_event, animation_piece_cursor, data_board);
                });
            });
            const rank = document.querySelectorAll("#chessboard > div.rank")[square.y];
            const good_square = rank.querySelectorAll("div.square")[square.x];
            good_square.insertAdjacentElement("beforeend", piece);
        }
    }
}

function chessboard(href, ws ,data_board, player_num, events){
    //init global variables
    player_number = player_num;
    console.log("player_number");
    console.log(player_number);
    events_listeners = events;

    const board = document.querySelector("#chessboard");
    if (!board)return;
    make_board(board, data_board, ws);
    document.removeEventListener("mousemove", moveMouse);
    document.addEventListener("mousemove", moveMouse);
    //send messages
    document.querySelector("#message-form > input[type=submit]").removeEventListener("click", messageSend);
    messageSend = ()=>{
        const message_input = document.querySelector("#send-message");
        const message = message_input.value;
        message_input.value = "";
        if (message!=="")ws.send("M:Anonyme|"+message);
    }
    document.querySelector("#message-form > input[type=submit]").addEventListener("click", messageSend);
    html_chess.event_moves_buttons(ws);
}
export { chessboard };
