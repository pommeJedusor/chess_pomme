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
            const user = await UserModel.is_correct_login(username, password);
            if (!user){
                return return_http_error(400, res, "wrong credentials");
            }

			const auth_cookie:string = await user.set_cookie();

			res.setHeader("Set-Cookie", `auth_cookie=${auth_cookie}`);
			res.writeHead(301, {
				Location: `http://localhost:8080/`
			}).end();

			console.log(user);
        }catch (error){
            return return_http_error(405, res, "fail to login");
        }
    });
}

export { main }