import { get_move } from "./test_stockfish.mjs";
import * as ws from "ws";
import * as Game from "./js_modules/Game.mjs";

let is_bot_running = false;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function play_move(board, socket){
    const result = await get_move(board);
    const move = board.board.moves.at(-1).get_notation_move();
    socket.send(move);
}

function bot(id_game){
    const url = "ws://localhost:3000/game?id_game="+id_game;
    const socket = new ws.WebSocket(url);
    let board = new Game.Game();

    socket.on("open", ()=>{
        socket.send("ID:"+id_game);
    });

    socket.on("message", (data)=>{
        const message = `${data}`.replace("\n", "");
        if (/^E:/.test(message)){
            console.log(message);
        }
        else if (/^S:/.test(message)){
            if (message[2]==="1"){
                play_move(board, socket);
            }
        }
        else{
            const result = board.play(message);
            if (result){
                play_move(board, socket);
            }
        }
    });

    socket.on("close", ()=>{
        is_bot_running = false;
    })
}

async function main(){
    while (true){
        if (is_bot_running){
            await delay(5000);
            continue;
        }
        const id_game = 404;
        bot(id_game);
        is_bot_running = true;
    }
}

main();