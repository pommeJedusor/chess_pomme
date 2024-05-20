import * as Board from "./Board.mjs";
import * as chess_html from "./chess_html.mjs";
import * as chess_ws_html from "./chess_ws_html.mjs";
import { chessboard } from "./chessboard.mjs";

let player_number = [null];
let events_listeners = [];
let data_board;
let timer_interval_id;
let global_minutes = [null, null];
let global_seconds = [null, null];
let global_ms = [null, null];
let global_timestamp;
const bot = location.pathname==="/stockfish" ? "stockfish:" : "";
const level = /[?&]level=([0-9]|1[0-9]|20)(\&|$)/.test(location.search) ? location.search.match(/level=(\d\d?)(\&|$)/)[1] : 20;
console.log(bot);

function get_minutes(){return document.URL.match(/[?&]minutes=(\d*)/)[1];};
function get_seconds(){return document.URL.match(/[?&]seconds=(\d*)/)[1];};
function get_minutes_from_timestamp(timestamp){return Math.floor(timestamp / 1000 / 60)}
function get_seconds_from_timestamp(timestamp){return Math.floor(timestamp / 1000) % 60}

function open(ws, bot=""){
  //against bot
  if (bot.length!==0){
    const minutes = get_minutes();
    const seconds = get_seconds();
    init_timer(minutes, seconds)
    console.log(bot);
    console.log(bot+level);
    ws.send(bot+level+"|minutes:"+minutes+"|seconds:"+seconds);
    return;
  }
  // against other player
  const url = "./api/join_game";
  const id_game = document.URL.match(/[?&]id_game=(\d*)/)[1];
  console.log(id_game);
  fetch(url, {
    "method": "post",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": JSON.stringify({"id": id_game, "player_id_game": sessionStorage.getItem(id_game)}),
  }).then(async (res)=>{
    const datas = await res.json();
    const player_id_game = datas.player_id_game;
    sessionStorage.setItem(id_game, player_id_game);
    const timestamp = datas.timestamp;
    global_timestamp = timestamp;
    const minutes = Math.floor(timestamp / 60 / 1000);
    const seconds = Math.floor(timestamp / 1000) % 60;
    console.log("ID:"+id_game);
    console.log("minutes:"+minutes);
    console.log("seconds:"+seconds);
    init_timer(minutes, seconds)
    ws.send(`ID:${id_game}|player_id_game:${player_id_game}`);
  });
  return;
}

function message(event, ws, player, events_listeners_red_squares){
    console.log("recieve: "+event.data);
    console.log(player);
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
        chess_ws_html.switch_moves_buttons(ws);
    }
    //if game started
    else if (/^S:/.test(event.data)){
        //if new game
        if (player){
            //reset timer
            if (timer_interval_id)clearInterval(timer_interval_id);
            init_timer(get_minutes_from_timestamp(global_timestamp), get_seconds_from_timestamp(global_timestamp));

            data_board = new Board.Board();
            chessboard(location.href, ws, data_board, player_number, events_listeners);
            chess_ws_html.switch_moves_buttons(ws);
        }
        player = Number(event.data[2]);
        let result = player===1 ? "Le deuxième joueur a rejoint" : "La partie commence";
        console.log("player : "+player)
        sessionStorage.setItem("chessboard_sens", player);
        chess_html.update_board_sens(player);

        chess_ws_html.insert_message(false, result);
        timer_interval_id = setInterval(()=>update_timer(data_board.moves, 10), 10);
        // update opponent username
        const opponent_username = event.data.substring(4);
        document.querySelector(".user-name").textContent = opponent_username;
        
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
    // rematch proposal
    else if (/^RP:/.test(event.data)){
        chess_ws_html.insert_rematch_proposal(ws);
    }
    // got datas game init
    else if (/^DATAS:/.test(event.data)){
      const datas = JSON.parse(event.data.substring(6));
      console.log(datas);
      player_number[0] = datas.color === "white" ? 1 : 2;
      player = player_number[0];
      chess_html.update_board_sens(player_number[0]);
      chess_html.update_usernames(datas.white_username, datas.black_username, player_number[0])

      timer_interval_id = setInterval(()=>update_timer(data_board.moves, 10), 10);
      for (let i=0;i<datas.moves.length;i++){
        const move = datas.moves[i]
        chess_ws_html.make_move(data_board, move.move, events_listeners_red_squares, player, 0);
      }
    }
    // insert move
    else {
        chess_ws_html.make_move(data_board, event.data, events_listeners_red_squares, player, 0);
    }
    return player;
}

function init_timer(minutes, seconds){
    if (minutes.length===1)minutes = "0"+minutes;
    if (seconds.length===1)seconds = "0"+seconds;
    const timer = minutes+":"+seconds
    const timer1 = document.querySelector("#timer1");
    const timer2 = document.querySelector("#timer2");
    timer1.textContent = timer;
    timer2.textContent = timer;
    global_minutes = [Number(minutes), Number(minutes)];
    global_seconds = [Number(seconds), Number(seconds)];
    global_ms = [0, 0];
}

function update_timer(moves, delay){
    if (moves.length<2)return;
    const player_turn = moves.length%2;
    const timer_el = document.getElementById("timer"+(player_turn+1));
    if (global_ms[player_turn]!==0){
        global_ms[player_turn]-=delay;
    }
    else if (global_seconds[player_turn]!==0){
        global_ms[player_turn] = 1000-delay;
        global_seconds[player_turn]--;
    }else if (global_minutes[player_turn]!==0){
        global_minutes[player_turn]--;
        global_seconds[player_turn] = 59;
    }
    const str_seconds = global_seconds[player_turn]<10 ? "0"+global_seconds[player_turn] : global_seconds[player_turn];
    const str_minutes = global_minutes[player_turn]<10 ? "0"+global_minutes[player_turn] : global_minutes[player_turn];
    const new_timer = str_minutes+":"+str_seconds;
    timer_el.textContent = new_timer;
}

function ws_init(){
    const href = location.href;
    data_board = new Board.Board();

    let ws = new WebSocket(href.replace(/^https?/, "ws").replace(/:8080/, ":3000"))

    ws.onopen = (event)=>open(ws, bot);
    ws.onmessage = (event) => player_number[0] = message(event, ws, player_number[0], events_listeners);
    ws.onclose = (event) => console.log("WebSocket connection closed");
    ws.onerror = (error) => console.error("WebSocket error:", error);

    chessboard(href, ws, data_board, player_number, events_listeners);
}

ws_init()
