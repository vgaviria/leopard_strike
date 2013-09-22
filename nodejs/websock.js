require('./PacketDesc.js');
var io = require('socket.io').listen(8456,{log:false});
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
		console.log('usr joined page:'+url+" total:"+server.pages[url].num);
		sendClientList(socket,server.pages[url]);
	}
}

function sendClientList(socket,page){
	var msg = new Packet(PacketTypes.CLIENTLIST);
	msg.clients = page.num;
	socket.volatile.emit('message',msg);
}
function randomColor(){
	return "rgba("+Math.floor(Math.random()*256)+","+
		Math.floor(Math.random()*256)+","+
		Math.floor(Math.random()*256)+",1)";
}
function constructNewPlayerPacket(id,x,y,color)
{
	var pkt = new Packet(PacketTypes.CREATEPLAYER);
	pkt.pid=id;
	pkt.x=x;
	pkt.y=y;
	pkt.rgb=color;
	return pkt;
}
function constructNewPlayerIDPacket(id)
{
	var pkt = new Packet(PacketTypes.SETPLAYERID);
	pkt.pid=id;
	return pkt;
}
function respondJoinGame(usr,socket,msg){
	if(msg.url){
		if(usr.room){
			console.log("player left("+usr.pid+"): "+msg.url);
			var room = server.rooms[usr.room];
			room.size--;
			if(room.size<1){
				console.log("game closed:"+msg.url);
				if(room.timer)
					clearInterval(room.timer);
				delete server.rooms[usr.room];
			}
		}
		var newRoom=msg.url;
		// currently rooms are assigned as msg.url+msg.checksum
		if(!server.rooms[newRoom]){
			server.rooms[newRoom]=new Room(newRoom);
			console.log("new room created:"+newRoom);
			setupRoom(server.rooms[newRoom]);
		}else{
			for(var key in server.rooms[newRoom].players){
				var p = server.rooms[newRoom].players[key];
				if(p.sock.id==usr.sock.id){
					delete server.rooms[newRoom].players[key];
					break;
				}
			}
		}
		server.rooms[newRoom].addPlayer(usr);
		server.rooms[newRoom].size++;
		console.log("client joined room("+usr.pid+"):"+newRoom);
		usr.x=100;
		usr.y=100;
		usr.deg=0;
		usr.color= randomColor();
		usr.room=newRoom;
		for( var key in server.rooms[newRoom].players){
			var p = server.rooms[newRoom].players[key];
			p.sock.volatile.emit('message',constructNewPlayerPacket(usr.pid,500,500,usr.color));
		}
		socket.volatile.emit('message',constructNewPlayerIDPacket(usr.pid));
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
	if(usr.pid && msg.x && msg.y && msg.deg)	
	{
		//console.log(msg);
		usr.x=msg.x;
		usr.y=msg.y;
		usr.deg=msg.deg;
		usr.bullets= usr.bullets.concat(msg.bullets);
		//Do some collision detection here.
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

function setupRoom(room){
	room.timer=setInterval(updateRoom,20,room);
}

function updateRoom(room){
	var update = {
		type:PacketTypes.UPDATEPLAYER,
		players:{}
	};
	for(var pid in room.players){
		var player = room.players[pid];
		if(player.sock.disconnected)
			delete room.players[pid];
		var tmp = {
			x:player.x,
			y:player.y,
			deg:player.deg,
			rgba:player.color
		};
		
		update.players[player.pid]=tmp;
		
	}
	for( var key in room.players){
		var p = room.players[key];
		update.bullets=[];
		for(var pid in room.players){
			if(key!=pid){
				update.bullets=update.bullets.concat(p.bullets);
			}
		} 
		p.sock.volatile.emit('message',update);
	}
	
	for( var key in room.players){
		var p = room.players[key];
		p.bullets=[];
	}
	
}