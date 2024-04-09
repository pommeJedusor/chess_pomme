import mariadb from "mariadb";
import config from "../config.json" assert { type: "json" };

const pool = mariadb.createPool({
    host: config.host, 
    user: config.user, 
    password: config.password,
    database: config.database
});

class Game{
    id;
    white_player;
    black_player;
    pgn;
    winner;
    date;
    status;
}

async function get_all_games(){
    const con = await pool.getConnection();
    const sql = "SELECT * FROM `chess_game` ORDER BY `date` ASC;";
    const rows = await con.query(sql);

    await con.end();

    const games = rows.map((row)=>{
        let game = new Game();

        game.id = row["id"];
        game.white_player = row["white_player"];
        game.black_player = row["black_player"];
        game.pgn = row["pgn"];
        game.winner = row["winner"];
        game.date = row["date"];
        game.status = row["status"];

        return game;
    });

    return games;
}

export { get_all_games };