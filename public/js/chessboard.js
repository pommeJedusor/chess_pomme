const width_square = 100;
const height_square = 100;
let global_piece;

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
    //piece
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.draggable = true;
    piece.addEventListener("dragstart", (e)=>global_piece=piece);
    board.querySelector(".square").insertAdjacentElement("beforeend", piece);
}

main();