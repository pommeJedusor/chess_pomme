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
    square.insertAdjacentElement("beforeend", piece_to_move);
    //castle
    if (/^O-O(-O)?[#+]?$/.test(notation_move)){
        const y = board.moves.length%2===0 ? 0 : 7;
        const x = /O-O-O/.test(notation_move) ? 0 : 7;
        const target_x = x===0 ? 3 : 5;
        const rook_to_move = get_html_piece(x, y);
        const square_rook = get_html_square(target_x, y);
        square_rook.insertAdjacentElement("beforeend", rook_to_move);
    }else if (the_move.piece==="P" && the_move.target_y===7){
        piece_to_move.classList.remove("pawn");
        const type_pieces = ["Q", "R", "B", "N"];
        const class_pieces = ["queen", "rook", "bishop", "knight"];
        piece_to_move.classList.add(class_pieces[type_pieces.indexOf(the_move.promotion[1])]);
    }else if (the_move.piece==="P" && the_move.is_taking && global_board.board[the_move.target_y][the_move.target_x]===0){
        //if en-passant
        get_html_piece(the_move.target_x, the_move.y).remove();
    }

    //make the move in the datas
    const piece = global_board.board[the_move.y][the_move.x];
    global_board.board = piece.do_move(global_board.board, the_move, piece.edit_func);
    global_board.moves.push(the_move);
}

function ws_init(href){
    let ws = new WebSocket(href.replace(/^https?/, "ws").replace(/:8080/, ":3000"))
    let player_number;

    ws.onopen = (event)=>websocket_chess.open(ws);
    ws.onmessage = (event) => websocket_chess.message(event, ws, player_number, global_board, make_move);
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
    if (move_found!==null){
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
            piece.addEventListener("dragstart", function (e){
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