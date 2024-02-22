import { Board, Pawn, King, Bishop, Rook, Knight, Queen, WHITE, BLACK } from "./Board.mjs";
import * as websocket_chess from "./chess.mjs";
const width_square = 100;
const height_square = 100;
let global_piece;
let global_piece_origin_pos;
let global_board;
let global_animation;
let ws;
let cursor_x = 0;
let cursor_y = 0;
let player_number;
let events_listeners = [];

function special_change(the_move, piece_to_move){
        const notation_move = the_move.get_notation_move();
        //castle
        if (/^O-O(-O)?[#+]?$/.test(notation_move)){
            const y = global_board.moves.length%2===0 ? 0 : 7;
            const x = /O-O-O/.test(notation_move) ? 0 : 7;
            const target_x = x===0 ? 3 : 5;
            const rook_to_move = get_html_piece(x, y);
            const square_rook = get_html_square(target_x, y);
            square_rook.insertAdjacentElement("beforeend", rook_to_move);
        }else if (the_move.piece==="P" && (the_move.target_y===7 || the_move.target_y===0)){
            console.log(piece_to_move);
            piece_to_move.classList.remove("pawn");
            const type_pieces = ["Q", "R", "B", "N"];
            const class_pieces = ["queen", "rook", "bishop", "knight"];
            piece_to_move.classList.add(class_pieces[type_pieces.indexOf(the_move.promotion[1])]);
        }else if (the_move.piece==="P" && the_move.is_taking && global_board.board[the_move.target_y][the_move.target_x]===0){
            //if en-passant
            get_html_piece(the_move.target_x, the_move.y).remove();
        }
}

document.addEventListener("mousemove", function (e){
    cursor_x = e.pageX;
    cursor_y = e.pageY;
})

function animation_move(){
    const origin_x = global_piece_origin_pos.x+50;
    const origin_y = global_piece_origin_pos.y+50;
    const x = cursor_x - origin_x;
    const y = cursor_y - origin_y;
    const style = "translate("+x+"px,"+y+"px)";
    global_piece.style.transform = style;
}

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

function make_move(board, notation_move){
    //get the move
    let the_move;
    for (const move of board.get_every_moves()){
        if (move.get_notation_move()===notation_move)the_move=move;
    }
    if (!the_move)return;
    //make the html move
    const piece_to_move = get_html_piece(the_move.x, the_move.y);
    const piece_to_take = get_html_piece(the_move.target_x, the_move.target_y);
    if (piece_to_take)piece_to_take.remove();
    const square = get_html_square(the_move.target_x, the_move.target_y);
    const trans_x = ((the_move.target_x-the_move.x)*100).toString()+"px";
    const trans_y = ((-the_move.target_y+the_move.y)*100).toString()+"px";
    piece_to_move.style.transitionDuration = "300ms";
    piece_to_move.style.transform = "translate("+trans_x+", "+trans_y+")";
    special_change(the_move, piece_to_move);
    setTimeout(function (){
        square.insertAdjacentElement("beforeend", piece_to_move);
        piece_to_move.style.transform = "translate(0, 0)";
        piece_to_move.style.transitionDuration = "0ms";
        console.log(the_move, piece_to_move)
    }, 300);

    //make the move in the datas
    const piece = global_board.board[the_move.y][the_move.x];
    global_board.board = piece.do_move(global_board.board, the_move, piece.edit_func);
    global_board.moves.push(the_move);
}

function ws_init(href){
    let ws = new WebSocket(href.replace(/^https?/, "ws").replace(/:8080/, ":3000"))
    player_number;

    ws.onopen = (event)=>websocket_chess.open(ws);
    ws.onmessage = (event) => player_number = websocket_chess.message(event, ws, player_number, global_board, make_move);
    ws.onclose = (event) => console.log("WebSocket connection closed");
    ws.onerror = (error) => console.error("WebSocket error:", error);

    return ws
}

function main(href){
    const board = document.querySelector("#chessboard");
    if (!board)return;
    const ws = ws_init(href);
    make_board(board, ws);
}

function no_drag_move(event, ws){
    const piece = global_piece;
    for (const square of document.querySelectorAll(".to_move"))square.classList.remove("to_move");
    if (global_board.moves.length%2===player_number%2){
        for (const event of events_listeners){
            event[0].removeEventListener("click", event[1]);
        }
        if (global_piece){
            global_piece.style.transform=null;
            global_piece=null;
        }
        clearInterval(global_animation);
        return;
    }
    const xy = get_xy_from_piece(global_piece)
    const x = Number(xy[0]);
    const y = Number(xy[1]);
    const moves = global_board.get_every_moves();
    let squares_to_edit = [];
    for (const move of moves){
        if (move.x===x && move.y===y)squares_to_edit.push({"square":get_html_square(move.target_x, move.target_y), "move":move});
    }
    console.log(squares_to_edit);
    for (const square_move of squares_to_edit){
        const square = square_move["square"];
        const move = square_move["move"];
        square.classList.add("to_move");
        function a(){
            square.innerHTML = "";
            special_change(move, piece);
            square.insertAdjacentElement("beforeend", piece);
            for (const square of document.querySelectorAll(".to_move"))square.classList.remove("to_move");
            const data_piece = global_board.board[move.y][move.x];
            global_board.moves.push(move);
            global_board.board = data_piece.do_move(global_board.board, move, data_piece.edit_func);
            ws.send(move.get_notation_move());
            global_piece_origin_pos = null;
            clearInterval(global_animation);
            console.log(events_listeners);
            for (const events_listener of events_listeners){
                events_listener[0].removeEventListener("click", events_listener[1]);
            }
        }
        events_listeners.push([square, a]);
        square.addEventListener("click", a);
    }
    global_piece.style.transform = "";
    global_piece = null;
    global_piece_origin_pos = null;
    clearInterval(global_animation);
}

function drop(event, ws) {
    if (!global_piece)return;
    event.preventDefault();
    const old_x = Number(global_piece.parentElement.classList[1]);
    const old_y = Number(global_piece.parentElement.parentElement.classList[1]);
    console.log(event)
    const origin_x = global_piece_origin_pos.x;
    const origin_y = global_piece_origin_pos.y;
    const dif_x = Math.floor((cursor_x - origin_x)/100);
    const dif_y = Math.floor((cursor_y - origin_y)/100);
    const new_x = old_x + dif_x;
    const new_y = old_y - dif_y;

    if (new_x===old_x && new_y===old_y)return no_drag_move(event, ws);//if drop on the same square
    const all_moves = global_board.get_every_moves();
    console.log(old_x, old_y, new_x, new_y)
    console.log(all_moves)
    let move_found = null;
    for (const move of all_moves){
        if (move.x===old_x && move.y===old_y && move.target_x===new_x && move.target_y===new_y){
            if (["=R", "=B", "=N"].includes(move.promotion))continue;
            move_found = move;
        }
    }
    //if move not found or not player's turn
    console.log(player_number, global_board.moves.length);
    if (move_found!==null && (!player_number || player_number%2!==global_board.moves.length%2)){
        special_change(move_found, get_html_piece(old_x, old_y))
        ws.send(move_found.get_notation_move());
        const square = get_html_square(new_x, new_y)
        square.innerHTML = "";
        square.insertAdjacentElement("beforeend", global_piece);
        const piece = global_board.board[old_y][old_x];
        global_board.board = piece.do_move(global_board.board, move_found, piece.edit_func);
        global_board.moves.push(move_found);
    }
    global_piece.style.transform = "";
    global_piece = null;
    global_piece_origin_pos = null;
    clearInterval(global_animation);
}

function make_board(board, ws){
    board.innerHtml = "";
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
    global_board = new Board();
    let type;
    for (let y=0;y<8;y++){
        for (let x=0;x<8;x++){
            const square = global_board.board[y][x];
            if (!square)continue;
            if (square.type==="P")type="pawn";
            if (square.type==="K")type="king";
            if (square.type==="Q")type="queen";
            if (square.type==="R")type="rook";
            if (square.type==="N")type="knight";
            if (square.type==="B")type="bishop";
            const piece = document.createElement("div");
            piece.classList.add("piece", type);
            if (square.color===WHITE)piece.classList.add("white");
            else piece.classList.add("black");
            piece.draggable = true;
            piece.addEventListener("mousedown", function (e){
                global_piece=piece;
                global_piece_origin_pos = piece.getBoundingClientRect();
                console.log(global_piece_origin_pos);
                global_animation = setInterval(animation_move,10)
                e.preventDefault();
            });
            const rank = document.querySelectorAll("#chessboard > div.rank")[square.y];
            const good_square = rank.querySelectorAll("div.square")[square.x];
            good_square.insertAdjacentElement("beforeend", piece);
        }
    }
    document.addEventListener("mouseup", (e)=>drop(e, ws));
}
main(location.href)