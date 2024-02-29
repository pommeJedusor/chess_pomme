import * as Board from "./Board.mjs";
import * as chess_html from "./chess_html.mjs";
import * as chess_ws_html from "./chess_ws_html.mjs";
import { chessboard } from "./chessboard.mjs";

let player_number = [null];
let events_listeners = [];
const bot = location.pathname==="/stockfish" ? "stockfish:" : "";
console.log(bot);

function open(ws, bot=""){
    //against bot
    console.log(bot);
    if (bot.length!==0){
        console.log(bot);
        ws.send(bot);
        return;
    }
    //against other player
    const match_result = document.URL.match(/(?<=(\?|\&)id_game=)\d*/);
    if (!match_result)return
    console.log("ID:"+match_result[0]);
    ws.send("ID:"+match_result[0])
}

function message(event, ws, player, data_board, events_listeners_red_squares){
    console.log("recieve: "+event.data);
    //remove last error message
    const last_error = document.querySelector(".error");
    if (last_error)last_error.remove();

    //if error
    if (/^E:/.test(event.data)){
        chess_ws_html.insert_message(false, event.data.replace(/^E:/, ""));
    }
    //if game finished
    else if (/^R:/.test(event.data)){
        let result = 1;
        if (event.data[2]==="L")result = -1;
        else if (event.data[2]==="D")result = 0;
        let reason = event.data.replace(/^R:(L|W|D):/, "");
        chess_ws_html.insert_end_message(result, reason);
    }
    //if game started
    else if (/^S:/.test(event.data)){
        player = Number(event.data[2]);
        let result = player===1 ? "Le deuxième joueur a rejoint" : "La partie commence";
        console.log("player : "+player)
        sessionStorage.setItem("chessboard_sens", player);
        chess_html.update_board_sens(player);

        chess_ws_html.insert_message(false, result);
        setInterval(()=>update_timer(data_board.moves), 1000);
    }
    //if recieve message
    else if (/^M:/.test(event.data)){
        const content = event.data.substr(2).split("|");
        const username = content[0];
        const message = content[1];
        chess_ws_html.insert_message(username, message);
    }
    //draw proposal
    else if (/^DP$/.test(event.data)){
        chess_ws_html.insert_draw_proposal(ws);
    }
    else {
        chess_ws_html.make_move(data_board, event.data, events_listeners_red_squares, player);
    }
    return player;
}

function send_move(){
    const move = document.getElementById("move_text");
    console.log("send: "+move.value);
    ws.send(move.value);
    move.value = "";
}
function update_timer(moves){
    if (moves.length<2)return;
    const timer_el = document.getElementById("timer"+(moves.length%2+1));
    const str_times = timer_el.textContent.split(":");
    let minutes = Number(str_times[0]);
    let seconds = Number(str_times[1]);
    if (seconds!==0){
        seconds--;
        seconds = seconds<10 ? "0"+seconds : seconds;
    }else if (minutes!==0){
        minutes--;
        seconds = 59;
    }
    const new_timer = minutes.toString()+":"+seconds;
    timer_el.textContent = new_timer;
}

function ws_init(){
    const href = location.href;
    const data_board = new Board.Board();

    let ws = new WebSocket(href.replace(/^https?/, "ws").replace(/:8080/, ":3000"))

    ws.onopen = (event)=>open(ws, bot);
    ws.onmessage = (event) => player_number[0] = message(event, ws, player_number[0], data_board, events_listeners);
    ws.onclose = (event) => console.log("WebSocket connection closed");
    ws.onerror = (error) => console.error("WebSocket error:", error);

    chessboard(href, ws, data_board, player_number, events_listeners);
}

ws_init()