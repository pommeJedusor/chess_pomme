async function get_games(){
    const url = "./get_games";
    const results = await fetch(url).then((res)=>res.json()).then((res)=>res);
    return results;
}

async function update_games(){
    const games = await get_games();

    for (const game of document.querySelectorAll(".waiting-game")){
        game.remove();
    }

    const games_section = document.querySelector("#waiting-games");
    for (const game of games){
        let game_a = document.createElement("a");
        game_a.textContent = "partie numero : "+game;
        game_a.href = "./game?id_game="+game;
        game_a.classList.add("waiting-game")
        games_section.insertAdjacentElement("beforeend", game_a);
    }
}

function main(){
    update_games();
    setInterval(update_games, 5000);
}

main();