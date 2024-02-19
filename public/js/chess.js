ws = new WebSocket(location.href.replace(/^https?/, "ws").replace(/:8080/, ":3000"))
let player_number;

ws.onopen = () => {
    console.log("WebSocket connection opened");
    const match_result = document.URL.match(/(?<=(\?|\&)id_game=)\d*/);
    if (!match_result)return
    ws.send("ID:"+match_result[0])
    
};

ws.onmessage = (event) => {
    console.log("recieve: "+event.data);
    //remove last error message
    const last_error = document.querySelector(".error");
    if (last_error)last_error.remove();

    //if error
    if (/^E:/.test(event.data)){
        const error_box = document.createElement("p");
        error_box.classList.add("error");
        const main = document.querySelector("main");
        error_box.textContent = event.data.replace(/^E:/, "");
        main.insertAdjacentElement('beforeend', error_box);
        return;
    }
    if (/^R:/.test(event.data)){
        const main = document.querySelector("main")
        const result = document.createElement("p");
        result.classList.add("game_result");

        result.textContent = "you have won: ";
        if (event.data[2]==="L")result.textContent = "you have lost: ";
        result.textContent += event.data.replace(/^R:(L|W):/, "")
        main.insertAdjacentElement('beforeend', result);
        return;
    }
    if (/^S:/.test(event.data)){
        player_number = Number(event.data[2]);
        const error_box = document.createElement("p");
        error_box.classList.add("error");
        const main = document.querySelector("main");
        error_box.textContent = player_number===1 ? "Le deuxième joueur a rejoint" : "La partie commence";
        main.insertAdjacentElement('beforeend', error_box);
        return;
    }
    const new_move = document.createElement("div");
    const moves = document.getElementById("moves");
    if (moves.childElementCount===1)setInterval(update_timer, 1000);

    if (moves.childElementCount%2===0)new_move.textContent = moves.childElementCount/2+1 + ". " + event.data;
    else new_move.textContent = event.data;

    new_move.classList.add("move")
    moves.appendChild(new_move);
};

ws.onclose = (event) => {
    console.log("WebSocket connection closed");
};

ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

function send_move(){
    const move = document.getElementById("move_text");
    console.log("send: "+move.value);
    ws.send(move.value);
    move.value = "";
}
function update_timer(){
    const moves = document.getElementById("moves");
    if (player_number%2===moves.childElementCount%2)return;
    const timer_el = document.getElementById("timer");
    const str_times = timer_el.textContent.split(":");
    let minutes = Number(str_times[0]);
    let seconds = Number(str_times[1]);
    if (seconds!==0){
        seconds--;
    }else if (minutes!==0){
        minutes--;
        seconds = 59;
    }
    const new_timer = minutes.toString()+":"+seconds.toString();
    timer_el.textContent = new_timer;
}