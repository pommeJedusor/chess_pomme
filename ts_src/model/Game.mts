import mariadb from "mariadb";
import fs from "fs"; 
import { User } from "./User.mjs";

interface Game {
    id:number;
    white_player:number|null;
    black_player:number|null;
    pgn:string|null;
    winner:string;
    date:string;
    status:string|null;
}

//config pool
let pool:mariadb.Pool|undefined;
fs.readFile("./config.json", function(err, data) { 
    if (err) throw err; 

    const config:mariadb.PoolConfig = JSON.parse(data.toString("utf8")); 
    pool = mariadb.createPool(config);
}); 

async function get_all_games(limit:number=Infinity):Promise<Game[]>{
    if (pool===undefined){
        throw Error("get_all_games: not connected to the db");
    }
    let conn:mariadb.PoolConnection|undefined;
    let games:Game[] = [];

    try {
        //query
        const limit_sql:string = limit === Infinity ? "" : ` LIMIT ${limit}`;
        const sql:string = `
            SELECT chess_game.id,
            u_white.username AS white_player,
            u_black.username AS black_player,
            pgn, winner,
            date AS date_timestamp,
            DATE_FORMAT(date, "%d/%m/%y %H:%i") AS date,
            status
            FROM chess_game
            LEFT JOIN user u_white ON u_white.id = chess_game.white_player
            LEFT JOIN user u_black ON u_black.id = chess_game.black_player
            ORDER BY date_timestamp DESC, id DESC
            ${limit_sql};
        `;
        //request
        conn = await pool.getConnection();
        games = await conn.query(sql);

    }catch (error){
        console.error("Error retrieving games:", error);
    }finally {
        if (conn!==undefined)conn.release();
        return games;
    }
}

function getExpectedScore(rating_a:number, rating_b:number):number{
  return 1 / (1 + 10 ** ((rating_b - rating_a) / 4000));
}

async function getPlayerK(player:User):Promise<number>{
  //ordered from min -> max elo
  const last_games = (await player.getLastElos(20)).sort((a, b)=>a - b);
  if (last_games.length < 5){
    return 300;
  }
  if (last_games.length < 10){
    return 225;
  }
  if (last_games.length < 15){
    return 170;
  }
  if (last_games.length < 20){
    return 100;
  }

  const max:number = last_games.at(-1) as number;
  const min:number = last_games[0];
  if (max - min < 100)return 15;

  return 30;
}

async function get_new_elos(player_a:User, player_b:User, winner:string):Promise<{"white":number,"black":number}>{
  if (winner!=="draw" && winner!=="white" && winner!="black"){
    throw `winner should either be 'white', 'black' or 'draw' but not '${winner}'`;;
  }

  const score_a:number = winner==="draw" ? 0.5 : (winner==="white" ? 1 : 0);
  const score_b:number = winner==="draw" ? 0.5 : (winner==="white" ? 0 : 1);


  const expected_a:number = getExpectedScore(player_a.getElo(), player_b.getElo());
  const expected_b:number = getExpectedScore(player_b.getElo(), player_a.getElo());
  const K_a:number = await getPlayerK(player_a);
  const K_b:number = await getPlayerK(player_b);

  const new_a = player_a.getElo() + K_a * (score_a - expected_a);
  const new_b = player_b.getElo() + K_b * (score_b - expected_b);
  return {
    "white": new_a,
    "black": new_b
  }
}

async function update_elo(white_player_id:number, black_player_id:number, winner:string){
  const player_a:User|false = await User.getUserById(white_player_id);
  const player_b:User|false = await User.getUserById(black_player_id);

  if (!player_a || !player_b){
    throw `failed to found ${white_player_id} or ${black_player_id}`;
  }
  const new_elos = await get_new_elos(player_a, player_b, winner);
  player_a.setElo(new_elos.white);
  player_b.setElo(new_elos.black);
  /*
  await player_a.update();
  await player_b.update();
  */
}

async function get_player_elo(id:number):Promise<number|null>{
  const player = await User.getUserById(id);
  if (!player)return null;
  return player.getElo();
}

async function insert_game(pgn:string, winner:string, status:string, white_player_id:number|null, black_player_id:number|null):Promise<void>{
  if (pool===undefined){
    throw Error("get_all_games: not connected to the db");
  }
  let conn:mariadb.PoolConnection|undefined;

  let white_elo:number|null = white_player_id ? await get_player_elo(white_player_id) : null;
  let black_elo:number|null = black_player_id ? await get_player_elo(black_player_id) : null;

  try {
    //query
    const sql:string = "INSERT INTO `chess_game` (`pgn`, `winner`, `status`, `white_player`, `black_player`, `white_elo`, `black_elo`) VALUES(?,?,?,?,?,?,?)";
    //request
    conn = await pool.getConnection();
    await conn.query(sql, [pgn, winner, status, white_player_id, black_player_id, white_elo, black_elo]);
  }catch (error) {
    console.error("Error insering game:", error);
    console.log(`pgn: ${pgn}`);
    return;
  }finally {
    if (conn!==undefined)conn.release();
  }
  if (white_player_id && black_player_id){
    update_elo(white_player_id, black_player_id, winner);
  }
}

export { get_all_games, insert_game, Game };
