import fs from "fs";
import http from "http";
import * as ejs from "ejs";
import { User } from "../model/User.mjs";

function return_http_error(error_code:number, res:http.ServerResponse<http.IncomingMessage>, status_message:string|undefined):void{
	res.writeHead(error_code, status_message);
	res.end();
}
function return_http_result(code:number, res:http.ServerResponse<http.IncomingMessage>, headers:http.OutgoingHttpHeaders, data:string|Buffer):void{
	res.writeHead(code, headers);
	res.write(data);
	res.end();
}

async function main(req:http.IncomingMessage, res:http.ServerResponse<http.IncomingMessage>, user:User|false){
    let text_response = "";
    req.on("data", (data)=>text_response+=data)
    .on("end", async ()=>{
        try {
            if (!text_response)throw "";
            const datas:Array<string> = text_response.split("&");
            let user:User|false;
            try {
                const username:string = datas.filter((el)=>/^username=/.test(el))[0].substring("username=".length);
                const password:string = datas.filter((el)=>/^password=/.test(el))[0].substring("password=".length);
                user = await User.connectUser(username, password);
                if (!user)throw "";
            }catch (error){
                throw error;
            }

			const auth_cookie:string = await user.setCookie();

			res.setHeader("Set-Cookie", `auth_cookie=${auth_cookie}; Max-Age=31536000`);
			res.writeHead(301, {
				Location: `./`
			}).end();
            return;
        }catch (error){
            if (error)console.log(error);
            const htmlContent:string = fs.readFileSync("./views/login.ejs", "utf8");
            const htmlRenderized:string = ejs.render(htmlContent, {
                filename: "login.ejs",
                error: `${error}`,
                user: user
            });
            return return_http_result(200, res, {"Content-Type":"text/html"}, htmlRenderized);
        }
    });
}

export { main }
