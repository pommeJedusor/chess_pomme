import { spawn } from 'node:child_process';
import { get_fen } from "../js_modules/fen.mjs";
import { get_square } from "../js_modules/Board.mjs";


const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function init_stockfish(move){
    const stockfish = spawn("./stockfish/stockfish");

    stockfish.stdout.on("data", (data)=>{
        const result = `${data}`.match(/bestmove ([^ ]*)[ \n]/);
        if (result)move[0] = result[1];
    });

    stockfish.stderr.on("data", (data)=>{
        console.log("error: "+data);
    });

    stockfish.on("close", (code)=>{
        console.log("closed");
    });
    return stockfish;
}

async function get_move(game, level=null){
    let p_move = [null];
    const stockfish = init_stockfish(p_move);
    const fen = get_fen(game.board);
    stockfish.stdin.write("uci\n");
    console.log(fen);
    stockfish.stdin.write("position fen "+fen+"\n");
    if (level!==null){
        console.log(level);
        stockfish.stdin.write("setoption name Skill Level value "+level+"\n");
    }
    stockfish.stdin.write("go movetime 3000\n");
    while (!p_move[0])await delay(500);
    const move = p_move[0];
    console.log(move);
    stockfish.stdin.write("quit\n");
    await delay(100);
    stockfish.kill();
    console.log(game.play(move, (m)=>{
        const promotion = m.promotion ? m.promotion[1].toLowerCase() : "";
        return move===get_square(m.x, m.y)+get_square(m.target_x, m.target_y)+promotion;
    }));
    return move;
}
export { get_move };