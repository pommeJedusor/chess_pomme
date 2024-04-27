import bcrypt from 'bcrypt';
import mariadb from "mariadb";
import fs from "fs"; 
import crypto from "crypto";

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
    private async generate_cookie():Promise<string> {
        return crypto.randomBytes(32).toString('hex').toString();
    }
    public async set_cookie():Promise<string>{
        const cookie:string = await this.generate_cookie();
        const sql:string = "INSERT INTO `auth_cookie`(`user_id`, `cookie`) VALUES(?,?)";
        let conn:mariadb.PoolConnection|undefined;
        try {
            if (pool===undefined)throw Error("not connected to the db");
            conn = await pool.getConnection();
            await conn.query(sql, [this.id, cookie])
        }catch (error){
            console.log(`Error while insering the cookie: ${error}`);
        }finally {
            if (conn!==undefined)conn.release();
        }
        return cookie;
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
    //query
    const sql:string = "INSERT INTO `user` (`username`, `password`) VALUES(?,?)";

    let conn:mariadb.PoolConnection|undefined;
    try {
        //request
        conn = await pool.getConnection();
        await conn.query(sql, [username, hash]);
    }catch (error) {
        throw Error("failed to insert the user in the db");
    }finally {
        if (conn!==undefined)conn.release();
    }
}

async function signup(username:string, password:string){
    if (pool===undefined){
        throw Error("not connected to the db");
    }
    if (!/^[a-zA-Z0-9 éèàêâôî']*$/.test(username))throw Error("unvalid caracters in the username");
    if (username.length>30)throw Error("max 30 caracters for the username");
    let conn:mariadb.PoolConnection|undefined;
    const sql_insert_user:string = "INSERT INTO `user`(`username`,`password) VALUES(?,?)";
    const sql_insert_cookie:string = "INSERT INTO `user`(`username`,`password) VALUES(?,?)";
    conn = await pool.getConnection();
    await conn.beginTransaction();
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