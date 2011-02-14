/**
 * Important note: this application is not suitable for benchmarks!
 */

var http = require('http')
	,https = require('https')
  , url = require('url')
  , fs = require('fs')
	, events = require("events")
  , io = require('../')
  , sys = require(process.binding('natives').util ? 'util' : 'sys')
  , server
	,accounts = []
	,dsclients = []
	,backupsets = [];
  var options = {
          key: fs.readFileSync('/root/cert2/dbi_databarracks_com.key'),
          cert: fs.readFileSync('/root/cert2/dbi_databarracks_com.crt')
        };
   
server = https.createServer(options,function(request, response){
  // your normal server code
  sys.log(request.connection.remoteAddress + ": " + request.method + " " + request.url);

	var proxy = http.createClient(4000,"localhost")
	  var proxy_request = proxy.request(request.method, request.url, request.headers);
	  proxy_request.addListener('response', function (proxy_response) {
	    proxy_response.addListener('data', function(chunk) {
	      response.write(chunk, 'binary');
	    });
	    proxy_response.addListener('end', function() {
	      response.end();
	    });
	    response.writeHead(proxy_response.statusCode, proxy_response.headers);
	  });
	  request.addListener('data', function(chunk) {
	    proxy_request.write(chunk, 'binary');
	  });
	  request.addListener('end', function() {
	    proxy_request.end();
	  });
	
	}),
  /*
  var path = url.parse(req.url).pathname;
  switch (path){
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1>Welcome. Try the <a href="/chat.html">chat</a> example.</h1>');
      res.end();
      break;
      
    case '/json.js':
    case '/chat.html':
      fs.readFile(__dirname + path, function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'})
        res.write(data, 'utf8');
        res.end();
      });
      break;
      
    default: send404(res);
  }
   */


send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};
var api_client = http.createClient(4000, "127.0.0.1");  
  
var api_emitter = new events.EventEmitter();  
// API calls 
function get_accounts() {  
    var request = api_client.request("GET", "/api/ob/client/2/202cb962ac59075b964b07152d234b70", {"host": "localhost"});  
  
    request.addListener("response", function(response) {  
        var body = "";  
        response.addListener("data", function(data) {  
            body += data;  
        });  
  
        response.addListener("end", function() {  
            var clients = JSON.parse(body);  
            if(clients.length > 0) {  
               // api_emitter.emit("clients", clients);  
								sys.puts("got clients");
							accounts = clients; 
            }  
        });  
    });  
  
    request.end();  
}
function get_dsclients() {  
    var request = api_client.request("GET", "/api/ob/ds/boxes/2/202cb962ac59075b964b07152d234b70", {"host": "localhost"});  
  
    request.addListener("response", function(response) {  
        var body = "";  
        response.addListener("data", function(data) {  
            body += data;  
        });  
  
        response.addListener("end", function() {  
            var _dsclients = JSON.parse(body);  
            if(_dsclients.length > 0) {  
               // api_emitter.emit("clients", clients);  
							sys.puts("got dsclients");
							dsclients = _dsclients; 
            }  
        });  
    });  
  
    request.end();  
} 
function get_backupsets() {  
    var request = api_client.request("GET", "/api/ob/ds/backupsets/2/202cb962ac59075b964b07152d234b70", {"host": "localhost"});  
  
    request.addListener("response", function(response) {  
        var body = "";  
        response.addListener("data", function(data) {  
            body += data;  
        });  
  
        response.addListener("end", function() {  
            var _bs = JSON.parse(body);  
            if(_bs.length > 0) {  
               // api_emitter.emit("clients", clients);  
							sys.puts("got backupsets");
							backupsets = _bs; 
            }  
        });  
    });  
  
    request.end();  
} 





// Cache data from API
get_accounts();
get_dsclients();
get_backupsets();

var listener = api_emitter.addListener("clients", function(clients) {  
            accounts = clients;
        });  
//setInterval(get_tweets, 5000);
server.listen(443);

// socket.io, I choose you
// simplest chat application evar
var io = io.listen(server)
  , buffer = [];
  
io.on('connection', function(client){

  //client.send({ buffer: buffer });
  io.clients[client.sessionId].send({clients:accounts});
  io.clients[client.sessionId].send({dsclients:dsclients});
  io.clients[client.sessionId].send({bs:backupsets});
  client.broadcast({ announcement: client.sessionId + ' connected' });
	
  
  client.on('message', function(message){
   // var msg = { message: [client.sessionId, message] };
   // buffer.push(msg);
   // if (buffer.length > 15) buffer.shift();
		if(message.action == "update" && message.recordType == "client"){
			get_accounts();
		}

    client.broadcast(message);
  });

  client.on('disconnect', function(){
    client.broadcast({ announcement: client.sessionId + ' disconnected' });
  });
});
