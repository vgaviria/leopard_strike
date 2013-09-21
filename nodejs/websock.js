var io = require('socket.io').listen(443);
var server={
	users:{},
};

io.sockets.on('connection', function (socket) {
	var hs = socket.handshake;
	server.users[socket.id] = new User(socket.id,socket);
	console.log('user('+server.users[socket.id]+') connected');
	socket.on('message', function (msg) {
		var usr = server.users[socket.id];
		if(usr && msg && msg.type){
			switch(msg){
				case PacketTypes.OPENPAGE:
					console.log("packet recieved by "+server.users[socket.id]+":"+msg);
					if(usr.room)
						socket.leave(usr.room);
					if(msg.url && msg.checksum){
						console.log("client joined an awesome room.");
						socket.join(msg.url+msg.checksum);
					}
				break;
			}
		}
	});
	socket.on('disconnect', function () {
		console.log('user('+server.users[socket.id]+') disconnected');
		delete server.users[socket.id];
	});
});

// packetdesc.js

var PacketTypes= {
	OPENPAGE:1, 		// params url, checksum
	CLIENTLIST:2,		// params clients 
	
};

var Packet = function(type){
	this.type=type;
}

var User = function(id, sock){
	this.id=id;
	this.sock=sock;
}