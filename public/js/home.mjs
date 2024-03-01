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

function launch_stockfish_game(){
    const bot_level_input = document.querySelector("#bot-level");
    if (!bot_level_input)return;
    const bot_level = bot_level_input.value;
    const url = "./stockfish?level="+bot_level;
    location.href = url;
}

function stockfish_popup(){
    const popup = `
    <div id="bot-parameters">
        <h2>Stockfish</h2>
        <form>
            <p>Level : <span id="level-bot">10</span></p>
            <label>Choix du level</label>
            <input type="range" name="" id="bot-level" min="0" max="20" oninput="document.querySelector('#level-bot').textContent=document.querySelector('#bot-level').value">
        </form>
        <button id="stockfish-games-button">Lancer la partie</button>
        <button id="close-button"></button>
    </div>
    `;
    document.body.insertAdjacentHTML("afterbegin", popup);
    const stockfish_button = document.querySelector("#stockfish-games-button");
    stockfish_button.addEventListener("click", launch_stockfish_game);
    const close_button = document.querySelector("#close-button");
    close_button.addEventListener("click", ()=>document.querySelector("#bot-parameters").remove());
}

function main(){
    update_games();
    setInterval(update_games, 5000);
    const link_stockfish = document.querySelector("#stockfish-games > h3 > a:first-child");
    console.log(link_stockfish);
    link_stockfish.addEventListener("click", (event)=>{
        event.preventDefault();
        stockfish_popup();
    });
}

main();