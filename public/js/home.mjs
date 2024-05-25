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
        game_a.textContent = `partie numero : ${game[0]}`;
        game_a.href = game[1];
        game_a.classList.add("waiting-game")
        waiting_games_section.insertAdjacentElement("beforeend", game_a);
    }
    const playing_games_section = document.querySelector("#playing-games");
    for (const game of playing_games){
        let game_a = document.createElement("a");
        game_a.textContent = `partie numero : ${game[0]}`;
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

function launch_game(){
  const minutes = Number(document.querySelector("#minutes-game").value);
  const seconds = Number(document.querySelector("#seconds-game").value);

  if (seconds<0 || seconds>59 || minutes<0 || minutes>60){
    alert("cadence invalide");
    return;
  }

  const timer = (minutes * 60 + seconds) * 1000;
  const url = "./api/init_game";
  const post_datas = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": JSON.stringify({"timer": timer}),
  }

  fetch(url, post_datas)
  .then(async (res)=>{
    const datas = await res.json();
    const id_game = datas.id_game;
    const target_url = `./game?id_game=${id_game}`;
    location.href = target_url;
  });
}

function stockfish_popup(){
  const popup = document.getElementById("bot-parameters");
  popup.classList.remove("hidden");

  const stockfish_button = document.querySelector("#stockfish-games-button");
  stockfish_button.addEventListener("click", launch_stockfish_game);

  const close_button = document.querySelector("#bot-parameters .close-button");
  close_button.addEventListener("click", ()=>popup.classList.add("hidden"));
}

function create_game_popup(){
  const popup = document.getElementById("game-parameters");
  popup.classList.remove("hidden");

  const launch_game_button = document.querySelector("#launch-games-button");
  launch_game_button.addEventListener("click", launch_game);

  const close_button = document.querySelector("#game-parameters .close-button");
  close_button.addEventListener("click", ()=>popup.classList.add("hidden"));
}

function main(){
  update_games();
  setInterval(update_games, 3000);

  const link_stockfish = document.querySelectorAll("h2.launch-game > a")[1];
  link_stockfish.addEventListener("click", (event)=>{
    event.preventDefault();
    stockfish_popup();
  });
  const link_game = document.querySelector("h2.launch-game > a");
  link_game.addEventListener("click", (event)=>{
    event.preventDefault();
    create_game_popup();
  });
}

main();
