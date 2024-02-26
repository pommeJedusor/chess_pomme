function get_pgn_date(){
    const date = new Date(Date.now());
    const year = date.getFullYear();
    const month = (date.getMonth()+1).toString();
    const final_month = month.length===1 ? "0"+month : month;
    const day = date.getDate();
    const final_day = day.length===1 ? "0"+day : day;
    const text_date = "[Date \"" + year + "." + final_month + "." + final_day + "\"]\n";
    return text_date;
}
function get_result(moves){
    if (!moves)return '[Result "*"]\n';
    const last_move = moves.at(-1).textContent;
    if (last_move[last_move.length-1]!=="#")return '[Result "*"]\n';
    const winner = moves.length%2;
    if (winner)return '[Result "1-0"]\n';
    else return '[Result "0-1"]\n';
}
function get_tag_pairs(moves=null){
    const event = '[Event "Casual Game"]\n';
    const site = '[Site "'+location.href+'"]\n';
    const date = get_pgn_date();
    const round = '[Round "1"]\n';
    const white = '[White "Anonymous"]\n';
    const black = '[Black "Anonymous"]\n';
    const result = get_result(moves);
    const tag_pairs = event+site+date+round+white+black+result+"\n";
    return tag_pairs;
}

function get_moves(){
    const moves_div = document.querySelector("#moves");
    const moves_p = moves_div.querySelectorAll("p");
    let moves = "";
    for (let i=0;i<moves_p.length;i++){
        moves+=moves_p[i].textContent+" ";
    }
    return moves;
}

function get_pgn(){
    const moves = get_moves();
    const tag_pairs = get_tag_pairs(moves);
    return tag_pairs+moves;
}