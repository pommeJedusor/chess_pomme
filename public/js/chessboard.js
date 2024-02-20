const width_square = 100;
const height_square = 100;

function main(){
    const squares = document.querySelectorAll(".square");
    for (const square of squares){
        square.onmousedown = (event)=>mouseDown(event, square);
    }
}

function mouseDown(event, square){
    event.preventDefault();
    
    document.onmouseup = (e)=>dropPiece(e, square);
    document.onmousemove = (e)=>elementDrag(e, square);
}

function elementDrag(e, square){
    console.log(square);
    square.style.top = (-height_square/2+e.y).toString()+"px";
    square.style.left = (-width_square/2+e.x).toString()+"px";
}

function dropPiece(e, square){
    document.onmouseup = null;
    document.onmousemove = null;
    square.style.top = (Math.floor(e.y/100)*100).toString()+"px";
    square.style.left = (Math.floor(e.x/100)*100).toString()+"px";
}

main();