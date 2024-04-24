import fs from "fs";
import http from "http";
import * as ejs from "ejs";

function return_http_error(error_code:number, res:http.ServerResponse<http.IncomingMessage>, status_message:string|undefined):void{
	res.writeHead(error_code, status_message);
	res.end();
}
function return_http_result(code:number, res:http.ServerResponse<http.IncomingMessage>, headers:http.OutgoingHttpHeaders, data:string|Buffer):void{
	res.writeHead(code, headers);
	res.write(data);
	res.end();
}

async function main(res:http.ServerResponse<http.IncomingMessage>){
    const htmlContent:string = fs.readFileSync('../views/login.ejs', 'utf8');
    const htmlRenderized:string = ejs.render(htmlContent, {filename: 'login.ejs'});
    return_http_result(200, res, {'Content-Type':'text/html'}, htmlRenderized);
}

export { main }