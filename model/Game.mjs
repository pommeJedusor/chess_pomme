import mariadb from "mariadb";
import config from "../config.json" assert { type: "json" };

const pool = mariadb.createPool({
    host: config.host, 
    user: config.user, 
    password: config.password,
    database: config.database,
    port: config.port
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
    const sql = `
    SELECT id, white_player, black_player, pgn, winner,
    DATE_FORMAT(date, "%d/%m/%y %H:%i") AS date,
    status
    FROM chess_game
    ORDER BY date DESC, id DESC;`;
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

async function insert_game(pgn, winner, status){
    const con = await pool.getConnection();
    const sql = "INSERT INTO `chess_game` (`pgn`, `winner`, `status`) VALUES(?,?,?)";
    const rows = await con.query(sql, [pgn, winner, status]);
    console.log(rows);
}

export { get_all_games, insert_game };