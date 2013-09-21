function respondClientList(socket,msg){
	//notify user via extension
}
function respondCreatePlayer(socket,msg){
	//construct player on the canvas.
}
function respondUpdatePlayer(socket,msg){
	//update player on the canvas
}
function respondCreateFX(socket,msg){
	//create graphical effects
}
function respondDamagePlayer(socket,msg){
	//damage players
}
function respondSetPlayerId(socket,msg){
	//set the player id so we know which
}

function sendOpenPage(url){
	var packet = new Packet(PacketTypes.OPENPAGE);
	packet.url=url;
	socket.send(packet);
}


var socket = io.connect('http://localhost:8124/');
  socket.on('connect', function () {
	socket.send({name:"awesome"});
    socket.on('message', function (msg) {
		if(msg && msg.type){
			switch(msg.type){
				case PacketTypes.CLIENTLIST:
					respondClientList(socket,msg);
				break;
				case PacketTypes.CREATEPLAYER:
					respondCreatePlayer(socket,msg);
				break;
			}
		}else if(msg)
			console.log("unknown message received"+msg.toString());
		else
			console.log("unknown message received");
    });
  });