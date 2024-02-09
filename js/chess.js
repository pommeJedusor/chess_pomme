ws = new WebSocket('ws://localhost:3000')
// Listen to the open event, which indicates the connection is established
ws.onopen = () => {
    console.log("WebSocket connection opened");
    // Send a message to the server
    ws.send("Hello");
};

// Listen to the message event, which contains the data received from the server
ws.onmessage = (event) => {
    console.log(event.data);
};

// Listen to the close event, which indicates the connection is closed
ws.onclose = (event) => {
    console.log("WebSocket connection closed");
};

// Listen to the error event, which indicates there is an error with the connection
ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

function send_move(){
    const move = document.getElementById("move");
    console.log(move.value);
    ws.send(move.value);
    move.value = "";
    return true;
}