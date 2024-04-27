import fs from "fs";
import http from "http";
import * as ejs from "ejs";
import * as UserModel from "../model/User.mjs";

function return_http_error(error_code:number, res:http.ServerResponse<http.IncomingMessage>, status_message:string|undefined):void{
	res.writeHead(error_code, status_message);
	res.end();
}
function return_http_result(code:number, res:http.ServerResponse<http.IncomingMessage>, headers:http.OutgoingHttpHeaders, data:string|Buffer):void{
	res.writeHead(code, headers);
	res.write(data);
	res.end();
}

async function main(req:http.IncomingMessage, res:http.ServerResponse<http.IncomingMessage>){
    console.log(req.headers.cookie);
    let text_response = "";
    req.on("data", (data)=>text_response+=data)
    .on("end", async ()=>{
        try {
            const json_response = JSON.parse(text_response);
            const username = json_response.username;
            const password = json_response.password;
            try {
                await UserModel.insert_user(username, password);
            }catch (error){
                return return_http_error(400, res, error as string);
            }
            res.writeHead(307, {
                Location: `http://localhost:8080/login`
            }).end();
        }catch (error){
            return return_http_error(405, res, "fail to signup");
        }
    });
}

export { main }