import bcrypt from 'bcrypt';
import mariadb from "mariadb";
import fs from "fs"; 
import crypto from "crypto";

async function get_auth_cookie(all_cookies:string|undefined):Promise<string|undefined>{
  if (!all_cookies)return;
  const cookies = all_cookies.split("; ").filter((cookie)=>/auth_cookie=/.test(cookie));
  if (cookies.length===0)return;
  return cookies[0].substring("auth_cookie=".length);
}

//config pool
let pool:mariadb.Pool|undefined;
fs.readFile("./config.json", function(err, data) { 
  if (err) throw err; 

  const config:mariadb.PoolConfig = JSON.parse(data.toString("utf8")); 
  pool = mariadb.createPool(config);
}); 

class User {
  private username:string;
  private id:number;
  private elo:number;
  
  static async getHash(password:string):Promise<string>{
    return await bcrypt.hash(password, 10);
  }

  static async generateCookie():Promise<string> {
    return crypto.randomBytes(32).toString('hex').toString();
  }

  static async isValidHash(password:string, hash:string):Promise<boolean>{
    return await bcrypt.compare(password, hash);
  }

  static async isUsernameTaken(username:string):Promise<boolean>{
    if (pool===undefined){
      throw "not connected to the db";
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

  static async getUserByName(username:string):Promise<User|false>{
    if (pool===undefined){
        throw "not connected to the db";
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
        //query
        const sql:string = "SELECT * FROM `user` WHERE `username` = ?;";
        //request
        conn = await pool.getConnection();
        const res = await conn.query(sql, [username]);
        if (res.length===0)return false;
        return new User(res[0].id, res[0].username, res[0].elo);
    }catch (error){
        throw error;
    }finally {
        if (conn!==undefined)conn.release();
    }
  }

  static async getUserById(id:number):Promise<User|false>{
    if (pool===undefined){
        throw "not connected to the db";
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
        const sql:string = "SELECT * FROM `user` WHERE `id` = ?;";
        conn = await pool.getConnection();
        const res = await conn.query(sql, [id]);
        if (res.length===0)return false;
        return new User(res[0].id, res[0].username, res[0].elo);
    }catch (error){
        throw error;
    }finally {
        if (conn!==undefined)conn.release();
    }
  }

  static async getUserByCookies(cookies:string):Promise<User|false>{
    const cookie:string|undefined = await get_auth_cookie(cookies);
    if (!cookie)return false;

    if (pool===undefined){
        throw "get_user_by_cookies: not connected to the db";
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
        const sql:string = "SELECT `user`.`id` AS id, `user`.`username` AS username, `user`.`elo` AS elo FROM `auth_cookie` JOIN `user` ON `auth_cookie`.`user_id`=`user`.`id` WHERE `auth_cookie`.`cookie` = ?;";
        conn = await pool.getConnection();
        const res = await conn.query(sql, [cookie]);
        if (res.length===0)return false;
        return new User(res[0].id, res[0].username, res[0].elo);
    }catch (error){
        throw error;
    }finally {
        if (conn!==undefined)conn.release();
    }
  }

  static async connectUser(username:string, password:string):Promise<User|false>{
    if (pool===undefined){
        throw "not connected to the db";
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
      const sql:string = "SELECT * FROM `user` WHERE `username` = ?;";
      conn = await pool.getConnection();
      const res = await conn.query(sql, [username]);
      if (res.length===0)return false;

      if (await User.isValidHash(password, res[0].password)){
        return new User(res[0].id, res[0].username, res[0].elo);
      }
      return false;
    }catch (error){
        throw error;
    }finally {
        if (conn!==undefined)conn.release();
    }
  }

  static isNotValidUsername(username:string):false|string{
      if (!/^[a-zA-Z0-9 éèàêâôî']*$/.test(username))return "unvalid caracters in the username";
      if (username.length>30)return "max 30 caracters for the username";
      if (username.length<3)return "min 3 caracters for the username";
      return false;
  }

  static async insertUser(username:string, password:string):Promise<User|string>{
      const hash:string = await User.getHash(password);
      const is_username_not_valid:string|false = User.isNotValidUsername(username);

      if (pool===undefined)return "not connected to the db";
      if (is_username_not_valid)return is_username_not_valid;
      if (await User.isUsernameTaken(username))return "username already exists";

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
      const user:User|false = await User.getUserByName(username);
      if (user)return user;
      return "failed to insert the user for unknown reason";
  }

  static async deleteCookie(cookie:string):Promise<void>{
    if (pool===undefined)throw "not connected to the db";

    //query
    const sql:string = "DELETE FROM `auth_cookie` WHERE `cookie` = ?;";
    let conn:mariadb.PoolConnection|undefined;

    try {
        //request
        conn = await pool.getConnection();
        await conn.query(sql, [cookie.substring(12)]);
    }catch (error) {
        throw "failed to insert the user in the db";
    }finally {
        if (conn!==undefined)conn.release();
    }
  }

  constructor(id:number, username:string, elo:number){
    this.id = id;
    this.username = username;
    this.elo = elo;
  }

  public getUsername():string{
    return this.username;
  }
  public getId():number{
    return this.id;
  }
  public getElo():number{
    return Math.floor(this.elo / 100);
  }
  public async getLastElos(number:number=20):Promise<Array<number>>{
    if (pool===undefined){
      throw "not connected to the db";
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
      const sql:string = "SELECT date, (CASE WHEN `white_player` = ? THEN `white_elo` ELSE `black_elo` END) AS elo FROM `chess_game` WHERE ? IN (`white_player`, `black_player`) AND (`white_player` IS NOT NULL AND `black_player` IS NOT NULL)  ORDER BY `date` DESC LIMIT ?;";
      conn = await pool.getConnection();
      const res = await conn.query(sql, [this.id, this.id, number]);
      return res.map((line:{elo:number})=>line.elo);
    }catch (error){
      throw error;
    }finally {
      if (conn!==undefined)conn.release();
    }
  }

  public setUsername(username:string):User|string{
    const is_not_valid_username = User.isNotValidUsername(username);
    if (is_not_valid_username){
      return is_not_valid_username;
    }

    this.username = username;
    return this;
  }
  public setElo(elo:number):User{
    this.elo = elo * 100;
    if (elo < 0){
      this.elo = 0;
    }
    return this;
  }

  public async setCookie():Promise<string>{
    const cookie:string = await User.generateCookie();
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

export { User };
