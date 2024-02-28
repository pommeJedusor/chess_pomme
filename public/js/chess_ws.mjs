import { insert_end_message, insert_message, insert_draw_proposal, update_board_sens, invert_board, make_move } from "./chess_html.mjs";

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
        insert_message(false, event.data.replace(/^E:/, ""));
    }
    //if game finished
    else if (/^R:/.test(event.data)){
        let result = 1;
        if (event.data[2]==="L")result = -1;
        else if (event.data[2]==="D")result = 0;
        let reason = event.data.replace(/^R:(L|W|D):/, "");
        insert_end_message(result, reason);
    }
    //if game started
    else if (/^S:/.test(event.data)){
        player = Number(event.data[2]);
        let result = player===1 ? "Le deuxième joueur a rejoint" : "La partie commence";
        console.log("player : "+player)
        sessionStorage.setItem("chessboard_sens", player);
        update_board_sens(player);

        insert_message(false, result);
        setInterval(()=>update_timer(data_board.moves), 1000);
    }
    //if recieve message
    else if (/^M:/.test(event.data)){
        const content = event.data.substr(2).split("|");
        const username = content[0];
        const message = content[1];
        insert_message(username, message);
    }
    //draw proposal
    else if (/^DP$/.test(event.data)){
        insert_draw_proposal(ws);
    }
    else {
        make_move(data_board, event.data, events_listeners_red_squares, player);
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
export { open, message, send_move, update_timer };