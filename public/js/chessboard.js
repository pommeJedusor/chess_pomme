const width_square = 100;
const height_square = 100;
let global_piece;
let global_board;

function main(){
    const board = document.querySelector("#chessboard");
    if (!board)return;
    make_board(board);
}

function drop(event) {
    if (!global_piece)return;
    event.preventDefault();
    event.target.appendChild(global_piece);
    global_piece = null;
}

function make_board(board){
    board.innerHtml = "";
    const NB_RANKS = 8;
    const NB_FILES = 8;
    for (let i=0;i<NB_RANKS;i++){
        const rank = document.createElement("div");
        rank.classList.add("rank", i);
        for (let j=0;j<NB_FILES;j++){
            const square = document.createElement("div");
            square.ondragover = "event.preventDefault();";
            square.ondrop = "console.dir(event)";
            square.classList.add("square", j);

            square.addEventListener("dragover", (e)=>e.preventDefault());
            square.addEventListener("drop", drop);

            rank.insertAdjacentElement('beforeend', square);
        }
        board.insertAdjacentElement('beforeend', rank);
    }
    //pieces
    global_board = new Board();
    let type;
    for (let y=0;y<8;y++){
        for (let x=0;x<8;x++){
            const square = global_board.board[y][x];
            if (!square)continue;
            if (square.type==="P")type="pawn";
            if (square.type==="K")type="king";
            if (square.type==="Q")type="queen";
            if (square.type==="R")type="rook";
            if (square.type==="N")type="knight";
            if (square.type==="B")type="bishop";
            const piece = document.createElement("div");
            piece.classList.add("piece", type);
            piece.draggable = true;
            piece.addEventListener("dragstart", (e)=>global_piece=piece);
            const rank = document.querySelectorAll("#chessboard > div.rank")[square.y];
            const good_square = rank.querySelectorAll("div.square")[square.x];
            good_square.insertAdjacentElement("beforeend", piece);
        }
    }
}

main();