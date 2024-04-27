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

class User implements User{
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
            if (pool===undefined)throw "not connected to the db";
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
    if (await is_username_taken(username))throw "username already exists";
    const hash:string = await get_hash(password);
    if (pool===undefined)throw "insert user: not connected to the db";
    if (!/^[a-zA-Z0-9 éèàêâôî']*$/.test(username))throw "unvalid caracters in the username";
    if (username.length>30)throw "max 30 caracters for the username";
    if (username.length<3)throw "min 3 caracters for the username";
    //query
    const sql:string = "INSERT INTO `user` (`username`, `password`) VALUES(?,?)";

    let conn:mariadb.PoolConnection|undefined;
    try {
        //request
        conn = await pool.getConnection();
        await conn.query(sql, [username, hash]);
    }catch (error) {
        throw "failed to insert the user in the db";
    }finally {
        if (conn!==undefined)conn.release();
    }
}

async function is_correct_login(username:string, password:string):Promise<User>{
    if (pool===undefined){
        throw "is_correct_login: not connected to the db";
    }
    let conn:mariadb.PoolConnection|undefined;

    try {
        //query
        const sql:string = "SELECT * FROM `user` WHERE `username`=?;";
        //request
        conn = await pool.getConnection();
        const res = await conn.query(sql, [username]);
        if (res.length===0)throw "wrong credentials";
        const hash = res[0].password;
        if (!await check_valid_hash(password, hash))throw "wrong credentials";
        return new User(res[0].id, res[0].username);
    }catch (error){
        if (typeof error === "string")throw error;
        throw `Error : ${error}`
    }finally {
        if (conn!==undefined)conn.release();
    }
}

async function is_username_taken(username:string):Promise<boolean>{
    if (pool===undefined){
        throw "is_correct_login: not connected to the db";
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
        //query
        const sql:string = "SELECT * FROM `user` WHERE `username`=?;";
        //request
        conn = await pool.getConnection();
        const res = await conn.query(sql, [username]);
        if (res.length===0)return false;
        return true;
    }catch (error){
        throw error;
    }finally {
        if (conn!==undefined)conn.release();
    }
}
export { insert_user, is_correct_login };