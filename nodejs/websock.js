require('./PacketDesc.js');
var io = require('socket.io').listen(8456);
var server={
	users:{},
	rooms:{},
	pages:{}
};



function respondOpenPage(usr,socket,msg){
	console.log("packet recieved by "+server.users[socket.id]+":"+msg);
	if(msg.url){
		var url = msg.url;
		if(usr.openpage){
			usr.openpage.num--;
			if(usr.openpage.num<=0)
				delete server.pages[usr.openpage.url];
		}
		if(!server.pages[url]){
			server.pages[url]= new Page(url);
			console.log('create new page:'+url);
		}
		usr.openpage=server.pages[url];
		server.pages[url].num++;
		sendClientList(socket,server.pages[url]);
	}
}

function sendClientList(socket,page){
	var msg = new Packet(PacketTypes.CLIENTLIST);
	msg.clients = page.num;
	socket.emit('message',msg);
}

function respondJoinGame(usr,socket,msg){
	if(msg.url){
		if(usr.room)
			socket.leave(usr.room);
		var newRoom=msg.url;
		// currently rooms are assigned as msg.url+msg.checksum
		console.log("client joined an awesome room.");
		socket.join(newRoom);
		if(!server.rooms[newRoom])
			server.rooms[newRoom]=new Room(newRoom);
		server.rooms[newRoom].addPlayer(usr);
	}
}

function respondFireBullet(usr,socket,msg){
	if(usr.room && usr.pid && msg.x && msg.y && msg.deg)
	{
		server.rooms[usr.room].bullets.push(new Bullet(msg.x,msg.y,
			10*Math.cos(msg.deg/180*Math.PI),10*Math.sin(msg.deg/180*Math.PI),5));
	}
}

function respondUpdatePlayer(usr,socket,msg){
	if(usr.room && usr.pid && msg.x && msg.y && msg.deg)
	{
		usr.x=msg.x;
		usr.y=msg.y;
		usr.deg=msg.deg;
		msg.pid = usr.pid;
		//Do some collision detection here.
		socket.broadcast.to(usr.room).emit('message',msg);
	}
}


io.sockets.on('connection', function (socket) {
	var hs = socket.handshake;
	server.users[socket.id] = new User(socket.id,socket);
	console.log('user('+server.users[socket.id]+') connected');
	socket.on('message', function (msg) {
		var usr = server.users[socket.id];
		if(usr && msg && msg.type){
			switch(msg.type){
				case PacketTypes.OPENPAGE:
					respondOpenPage(usr,socket,msg);
					break;
				case PacketTypes.JOINGAME:
					respondJoinGame(usr,socket,msg);
					break;
				case PacketTypes.UPDATEPLAYER:
					respondUpdatePlayer(usr,socket,msg);
					break;
				case PacketTypes.FIREBULLET:
					respondFireBullet(usr,socket,msg);
					break;
			}
		}else if(msg)
			console.log(msg);
		else
			console.log("unknown message received");
	});
	socket.on('disconnect', function () {
		console.log('user('+server.users[socket.id]+') disconnected');
		delete server.users[socket.id];
	});
});