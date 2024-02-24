import { Board, Pawn, King, Bishop, Rook, Knight, Queen, WHITE, BLACK } from "./Board.mjs";
import * as websocket_chess from "./chess_ws.mjs";
import * as html_chess from "./chess_html.mjs";
let cursor_x = 0;
let cursor_y = 0;
let player_number;
let events_listeners = [];

//makes changes on the html board for special moves (castle, promotion, en-passant)
function special_change(the_move, piece_to_move, data_board){
        const notation_move = the_move.get_notation_move();
        //castle
        if (/^O-O(-O)?[#+]?$/.test(notation_move)){
            const y = data_board.moves.length%2===0 ? 0 : 7;
            const x = /O-O-O/.test(notation_move) ? 0 : 7;
            const target_x = x===0 ? 3 : 5;
            html_chess.move_piece(x, y, target_x, y);
        }else if (the_move.piece==="P" && (the_move.target_y===7 || the_move.target_y===0)){
            piece_to_move.classList.remove("pawn");
            const type_pieces = ["Q", "R", "B", "N"];
            const class_pieces = ["queen", "rook", "bishop", "knight"];
            piece_to_move.classList.add(class_pieces[type_pieces.indexOf(the_move.promotion[1])]);
        }else if (the_move.piece==="P" && the_move.is_taking && data_board.board[the_move.target_y][the_move.target_x]===0){
            //if en-passant
            html_chess.get_html_piece(the_move.target_x, the_move.y).remove();
        }
}

function make_move(data_board, notation_move){
    html_chess.insert_move(notation_move);
    //get the move
    let the_move;
    for (const move of data_board.get_every_moves()){
        if (move.get_notation_move()===notation_move){
            the_move=move;
            break;
        }
    }
    if (!the_move)return;
    //make the html move
    html_chess.move_piece(the_move.x, the_move.y, the_move.target_x, the_move.target_y, player_number);
    special_change(the_move, html_chess.get_html_piece(the_move.x, the_move.y), data_board);
    //make the move in the datas
    const piece = data_board.board[the_move.y][the_move.x];
    data_board.board = piece.do_move(data_board.board, the_move, piece.edit_func);
    data_board.moves.push(the_move);
}

function no_drag_move(event, ws, piece, animation_piece_cursor, data_board){
    for (const square of document.querySelectorAll(".to_move"))square.classList.remove("to_move");
    for (const event of events_listeners){
        event[0].removeEventListener("click", event[1]);
    }
    events_listeners = [];
    if (data_board.moves.length%2===player_number%2){
        if (piece)piece.style.transform=null;
        clearInterval(animation_piece_cursor);
        return;
    }
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
    for (const square_move of squares_to_edit){
        const square = square_move["square"];
        const piece_move = square_move["piece"];
        const move = square_move["move"];
        square.classList.add("to_move");
        function a(){
            html_chess.insert_move(move.get_notation_move());
            square.innerHTML = "";
            special_change(move, piece, data_board);
            square.insertAdjacentElement("beforeend", piece);
            for (const square of document.querySelectorAll(".to_move"))square.classList.remove("to_move");
            const data_piece = data_board.board[move.y][move.x];
            data_board.moves.push(move);
            data_board.board = data_piece.do_move(data_board.board, move, data_piece.edit_func);
            ws.send(move.get_notation_move());
            clearInterval(animation_piece_cursor);
            for (const events_listener of events_listeners){
                events_listener[0].removeEventListener("click", events_listener[1]);
            }
        }
        if (!player_number)continue;
        if (piece_move){
            events_listeners.push([piece_move, a]);
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
    const dif_x = Math.floor((cursor_x - origin_x)/width_squares);
    const dif_y = Math.floor((cursor_y - origin_y)/width_squares);
    const new_x = old_x + dif_x;
    const new_y = old_y - dif_y;

    if (!data_board.get_every_moves().filter((move)=>move.x===old_x && move.y===old_y && move.target_x===new_x && move.target_y===new_y)){
        for (const square of document.querySelectorAll(".to_move"))square.classList.remove("to_move");
        for (const event of events_listeners){
            event[0].removeEventListener("click", event[1]);
        }
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
    if (move_found!==null && (player_number && player_number%2!==data_board.moves.length%2)){
        //html
        html_chess.insert_move(move_found.get_notation_move());
        const square = html_chess.get_html_square(new_x, new_y)
        square.innerHTML = "";
        square.insertAdjacentElement("beforeend", piece);
        special_change(move_found, piece, data_board)
        //datas
        const data_piece = data_board.board[old_y][old_x];
        data_board.board = data_piece.do_move(data_board.board, move_found, data_piece.edit_func);
        data_board.moves.push(move_found);
        ws.send(move_found.get_notation_move());
    }
    piece.style.transform = "";
    clearInterval(animation_piece_cursor);
}

//make the html board and init all the event listeners
function make_board(board, data_board, ws){
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
    let type;
    for (let y=0;y<8;y++){
        for (let x=0;x<8;x++){
            const square = data_board.board[y][x];
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
                const piece_origin_pos = piece.getBoundingClientRect();
                const animation_piece_cursor = setInterval(()=>html_chess.instant_move_piece(piece, piece_origin_pos, cursor_x, cursor_y),10)
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

function ws_init(href, data_board){
    let ws = new WebSocket(href.replace(/^https?/, "ws").replace(/:8080/, ":3000"))

    ws.onopen = (event)=>websocket_chess.open(ws);
    ws.onmessage = (event) => player_number = websocket_chess.message(event, ws, player_number, data_board, make_move);
    ws.onclose = (event) => console.log("WebSocket connection closed");
    ws.onerror = (error) => console.error("WebSocket error:", error);

    return ws
}

function main(href){
    const board = document.querySelector("#chessboard");
    if (!board)return;
    const data_board = new Board();
    const ws = ws_init(href, data_board);
    make_board(board, data_board, ws);
    document.addEventListener("mousemove", function (e){
        cursor_x = e.pageX;
        cursor_y = e.pageY;
    })
}

main(location.href)