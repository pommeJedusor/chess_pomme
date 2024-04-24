import bcrypt from 'bcrypt';
import mariadb from "mariadb";
import fs from "fs"; 

//config pool
let pool:mariadb.Pool|undefined;
fs.readFile("./config.json", function(err, data) { 
    if (err) throw err; 

    const config:mariadb.PoolConfig = JSON.parse(data.toString("utf8")); 
    pool = mariadb.createPool(config);
}); 

class User {
    username:string;
    id:number;
    constructor(id:number, username:string){
        this.id = id;
        this.username = username;
    }
}

async function get_hash(password:string):Promise<string>{
    return await bcrypt.hash(password, 10);
}
async function check_valid_hash(password:string, hash:string):Promise<boolean>{
    return await bcrypt.compare(password, hash);
}

async function insert_user(username:string, password:string):Promise<void>{
    const hash:string = await get_hash(password);
    if (pool===undefined){
        throw Error("insert user: not connected to the db");
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
        //query
        const sql:string = "INSERT INTO `user` (`username`, `password`) VALUES(?,?)";
        //request
        conn = await pool.getConnection();
        await conn.query(sql, [username, hash]);
    }catch (error) {
        console.error("Error insering new user:", error);
    }finally {
        if (conn!==undefined)conn.release();
    }
}

async function is_correct_login(username:string, password:string):Promise<false|User>{
    if (pool===undefined){
        throw Error("is_correct_login: not connected to the db");
    }
    let conn:mariadb.PoolConnection|undefined;

    try {
        //query
        const sql:string = "SELECT * FROM `user` WHERE `username`=?;";
        //request
        conn = await pool.getConnection();
        const res = await conn.query(sql, [username]);
        const hash = res[0].password;
        if (!await check_valid_hash(password, hash))return false;
        return new User(res[0].id, res[0].username);
    }catch (error){
        console.error("Error retrieving games:", error);
        return false;
    }finally {
        if (conn!==undefined)conn.release();
    }
}
export { insert_user, is_correct_login };