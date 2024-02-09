ws = new WebSocket('ws://localhost:3000')

ws.onopen = () => {
    console.log("WebSocket connection opened");
    const match_result = document.URL.match(/(?<=(\?|\&)id_game=)\d*/);
    if (!match_result)return
    ws.send("ID:"+match_result[0])
    
};

ws.onmessage = (event) => {
    console.log("recieve: "+event.data);
    const new_move = document.createElement("div");
    const moves = document.getElementById("moves");

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