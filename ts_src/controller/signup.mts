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
        const username:string = datas.filter((el)=>/^username=/.test(el))[0].substring("username=".length);
        const password:string = datas.filter((el)=>/^password=/.test(el))[0].substring("password=".length);

        const user:User|string = await User.insertUser(username, password);
        
        if (typeof user === "string")throw user;

        res.writeHead(307, {
          Location: `./login`
        }).end();
        return;
      }catch (error){
        const htmlContent:string = fs.readFileSync("./views/signup.ejs", "utf8");
        const htmlRenderized:string = ejs.render(htmlContent, {
          filename: "signup.ejs",
          error: `${error}`,
          user: user
        });
        return return_http_result(200, res, {"Content-Type":"text/html"}, htmlRenderized);
      }
  });
}

export { main }
