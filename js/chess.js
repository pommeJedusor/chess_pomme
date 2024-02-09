ws = new WebSocket('ws://localhost:3000')

ws.onopen = () => {
    console.log("WebSocket connection opened");
};

ws.onmessage = (event) => {
    console.log("recieve: "+event.data);
    const new_move = document.createElement("div");
    const moves = document.getElementById("moves");
    new_move.textContent = event.data;
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