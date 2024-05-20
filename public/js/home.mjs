async function get_waiting_games(){
    const url = "./get_waiting_games";
    const results = await fetch(url).then((res)=>res.json()).then((res)=>res);
    return results;
}
async function get_playing_games(){
    const url = "./get_playing_games";
    const results = await fetch(url).then((res)=>res.json()).then((res)=>res);
    return results;
}

async function update_games(){
    const waiting_games = await get_waiting_games();
    const playing_games = await get_playing_games();

    for (const game of document.querySelectorAll(".waiting-game")){
        game.remove();
    }
    for (const game of document.querySelectorAll(".playing-game")){
        game.remove();
    }

    const waiting_games_section = document.querySelector("#waiting-games");
    for (const game of waiting_games){
        let game_a = document.createElement("a");
        game_a.textContent = "partie numero : "+game[0];
        game_a.href = game[1];
        game_a.classList.add("waiting-game")
        waiting_games_section.insertAdjacentElement("beforeend", game_a);
    }
    const playing_games_section = document.querySelector("#playing-games");
    for (const game of playing_games){
        let game_a = document.createElement("a");
        game_a.textContent = "partie numero : "+game[0];
        game_a.href = game[1];
        game_a.classList.add("playing-game")
        playing_games_section.insertAdjacentElement("beforeend", game_a);
    }
}

function launch_stockfish_game(){
    const bot_level = document.querySelector("#bot-level").value;
    const minutes = Number(document.querySelector("#minutes-game").value);
    const seconds = Number(document.querySelector("#seconds-game").value);
    const url = "./stockfish?level="+bot_level+"&minutes="+minutes+"&seconds="+seconds;
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
            <h3>Choix de la cadence</h3>
            <label for="minutes-game">minutes</label>
            <input type="number" name="minutes-game" id="minutes-game" value="20" min="0" max="59">
            <label for="seconds-game">minutes</label>
            <input type="number" name="seconds-game" id="seconds-game" value="0" min="0" max="59">
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

function launch_game(){
  const minutes = Number(document.querySelector("#minutes-game").value);
  const seconds = Number(document.querySelector("#seconds-game").value);
  if (seconds<0 || seconds>59 || minutes<0 || minutes>60){
    alert("cadence invalide");
    return;
  }

  const timer = (minutes * 60 + seconds) * 1000;
  const url = "./api/init_game";

  fetch(url, {
    "method": "post",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": JSON.stringify({"timer": timer}),
  }).then(async (res)=>{
    const datas = await res.json();
    const id_game = datas.id_game;
    const target_url = `./game?id_game=${id_game}`;
    location.href = target_url;
  });
}

function create_game_popup(){
    const popup = `
    <div id="game-parameters">
        <h2>Créer une partie</h2>
        <form>
            <h3>Choix de la cadence</h3>
            <label for="minutes-game">minutes</label>
            <input type="number" name="minutes-game" id="minutes-game" value="20" min="0" max="59">
            <label for="seconds-game">minutes</label>
            <input type="number" name="seconds-game" id="seconds-game" value="0" min="0" max="59">
        </form>
        <button id="launch-games-button">Lancer la partie</button>
        <button id="close-button"></button>
    </div>
    `;
    document.body.insertAdjacentHTML("afterbegin", popup);
    const launch_game_button = document.querySelector("#launch-games-button");
    launch_game_button.addEventListener("click", launch_game);
    const close_button = document.querySelector("#close-button");
    close_button.addEventListener("click", ()=>document.querySelector("#game-parameters").remove());
}

function main(){
    update_games();
    setInterval(update_games, 5000);
    const link_stockfish = document.querySelector("#stockfish-games > h3 > a:first-child");
    link_stockfish.addEventListener("click", (event)=>{
        event.preventDefault();
        stockfish_popup();
    });
    const link_game = document.querySelector("h2 > a");
    link_game.addEventListener("click", (event)=>{
        event.preventDefault();
        create_game_popup();
    });
}

main();
