/**
 * Important note: this application is not suitable for benchmarks!
 */

var http = require('http')
	, https = require('https')
  , url = require('url')
  , fs = require('fs')
	, events = require("events")
  , io = require('../')
  , sys = require(process.binding('natives').util ? 'util' : 'sys')
  , server
	, api_server_name = "dbi.databarracks.com"
	,accounts = []
	,dsclients = []
	,backupsets = [];
    
server = http.createServer(function(req, res){
  // your normal server code
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
}),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};



var api_client = http.createClient(4001, "localhost");  
  
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
            dsclients = JSON.parse(body);
             sys.puts("got dsclients");
        });
    });

    request.end();
}


function get_backupsets() {
    var request = api_client.request("GET", "/api/ds/backupsets/2/202cb962ac59075b964b07152d234b70", {"host": "localhost"});

    request.addListener("response", function(response) {
        var body = "";
        response.addListener("data", function(data) {
            body += data;
        });

        response.addListener("end", function() {
            backupsets = JSON.parse(body);
             sys.puts("got backupsets");
        });
    });

    request.end();
}





// Cache data from API
get_accounts();
get_dsclients();
get_backupsets();
 
//setInterval(get_tweets, 5000);
server.listen(81);

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
