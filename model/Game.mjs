import mariadb from "mariadb";
import config from "../config.json" assert { type: "json" };

const pool = mariadb.createPool({
    host: config.host, 
    user: config.user, 
    password: config.password,
    database: config.database,
    port: config.port,
    limit: config.limit
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

async function get_all_games(limit=Infinity){
    try {
        const con = await pool.getConnection();
        const limit_sql = limit === Infinity ? "" : ` LIMIT ${limit}`;
        const sql = `
            SELECT id, white_player, black_player, pgn, winner,
            DATE_FORMAT(date, "%d/%m/%y %H:%i") AS date,
            status
            FROM chess_game
            ORDER BY date DESC, id DESC
            ${limit_sql};
        `;
        const rows = await con.query(sql);
        con.release();

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
    }catch (error){
        console.error("Error retrieving games:", error);
        return [];
    }
}

async function insert_game(pgn, winner, status){
    const con = await pool.getConnection();
    const sql = "INSERT INTO `chess_game` (`pgn`, `winner`, `status`) VALUES(?,?,?)";
    const rows = await con.query(sql, [pgn, winner, status]);
    con.release()
    console.log(rows);
}

export { get_all_games, insert_game };