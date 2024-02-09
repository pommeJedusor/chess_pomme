const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const port = 8080;

const server = http.createServer(function (req, res){
	const url = req.url;
	console.log(url);
	switch (url){
		case "/":
			fs.readFile("./html/index.html",function(err, data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.write(data);
				res.end()
			})
			return
		case "/js/chess.js":
			fs.readFile("./js/chess.js",function(err, data){
				res.writeHead(200, {'Content-Type':'text/javascript'});
				res.write(data);
				res.end()
			})
			return
		case "/css/style.css":
			fs.readFile("./css/style.css",function(err, data){
				res.writeHead(200, {'Content-Type':'text/css'});
				res.write(data);
				res.end()
			})
			return
		default:
			res.writeHead(404);
			res.end();
			return
	}
})

server.listen(port, function(error){
	if (error) {
		console.log(error);
	}else {
		console.log("server is listening on port: " + port);
	}
})


const ws_server = new WebSocket.Server({
	port: 3000
});

let sockets = [];
ws_server.on('connection', function(socket) {
	sockets.push(socket);

	socket.on('message', function(msg) {
		console.log("recieve: " + msg);
		socket.send(msg.toString());
		socket.send("e6");
	});

	socket.on('close', function() {
		console.log("socket closed");
		sockets = sockets.filter(s => s !== socket);
	});
});