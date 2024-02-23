function open(ws){
    const match_result = document.URL.match(/(?<=(\?|\&)id_game=)\d*/);
    if (!match_result)return
    ws.send("ID:"+match_result[0])
    //check if game timed out
    setInterval(()=>{
        ws.send("T")
    }, 10000);
}

function message(event, ws, player, data_board, make_move){
    console.log("recieve: "+event.data);
    //remove last error message
    const last_error = document.querySelector(".error");
    if (last_error)last_error.remove();

    //if error
    if (/^E:/.test(event.data)){
        console.log(event.data.replace(/^E:/, ""));
        return player;
    }
    if (/^R:/.test(event.data)){
        let result = "you have won: ";
        if (event.data[2]==="L")result = "you have lost: ";
        result += event.data.replace(/^R:(L|W):/, "");
        alert(result);
        return player;
    }
    if (/^S:/.test(event.data)){
        player = Number(event.data[2]);
        let result = player===1 ? "Le deuxième joueur a rejoint" : "La partie commence";
        console.log(result);
        setInterval(()=>update_timer(data_board.moves), 1000);
        return player;
    }
    make_move(data_board, event.data);
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