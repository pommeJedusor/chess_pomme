import { spawn } from 'node:child_process';
import * as Game from "./js_modules/Game.mjs";
import { get_fen } from "./js_modules/fen.mjs";
import { get_square } from "./js_modules/Board.mjs";

let board = new Game.Game();
let move;


function init_stockfish(){
    const stockfish = spawn("./stockfish/stockfish-ubuntu-x86-64-sse41-popcnt");

    stockfish.stdout.on("data", (data)=>{
        const result = `${data}`.match(/bestmove ([^ ]*) /);
        if (result)move = result[1];
    });

    stockfish.stderr.on("data", (data)=>{
        console.log("error: "+data);
    });

    stockfish.on("close", (code)=>{
        console.log("closed");
    });
    return stockfish;
}

function get_move(game){
    const stockfish = init_stockfish();
    const fen = get_fen(game.board);
    stockfish.stdin.write("uci\n");
    console.log(fen);
    stockfish.stdin.write("position fen "+fen+"\n");
    stockfish.stdin.write("go movetime 2000\n");
    setTimeout(()=>{
        console.log(move);
        stockfish.stdin.write("quit\n");
        setTimeout(stockfish.kill,100);
        console.log(game.play(move, (m)=>{
            return move===get_square(m.x, m.y)+get_square(m.target_x, m.target_y);
        }));
    },3000);
}

//terminal
process.stdin.on("data", (data)=>{
    console.log("recieve : "+data)
    console.log(board.play(`${data}`.replace("\n", "")));
    console.log(board.moves);
    get_move(board);
});