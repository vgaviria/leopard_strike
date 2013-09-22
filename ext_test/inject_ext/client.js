function respondClientList(socket,msg){
	//notify user via extension
	chrome.browserAction.setBadgeText({text:msg.clients.toString()});
}
function respondCreatePlayer(socket,msg){
	//construct player on the canvas.
	currentport.postMessage(msg);
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
function respondObtainLevel(msg){
	//msg.obstacles msg.noObstacles are the 2 important things
	//used in player spawn point stuff + player needs
}
function respondServeLevel(socket,msg){
	//serve a level back to a requesting player
}

function sendOpenPage(url){
	var packet = new Packet(PacketTypes.OPENPAGE);
	packet.url=url;
	socket.emit('message',packet);
}

function sendJoinGame(url){
	var packet = new Packet(PacketTypes.JOINGAME);
	packet.url=url;
	socket.emit('message',packet);
}


var socket = io.connect('http://25.17.237.229:8456/');//"http://25.17.237.229:8456/");//
  socket.on('connect', function () {
    socket.on('message', function (msg) {
		if(msg && msg.type){
			switch(msg.type){
				case PacketTypes.CLIENTLIST:
					respondClientList(socket,msg);
				break;
				case PacketTypes.REQUESTLEVEL:
					respondServeLevel(msg);
				break;
				case PacketTypes.SERVELEVEL:
					respondObtainLevel(msg);
				break;
				case PacketTypes.CREATEPLAYER:
				case PacketTypes.SETPLAYERID:
				case PacketTypes.UPDATEPLAYER:
					currentport.postMessage(msg);
				break;
			}
		}else if(msg){
			console.log('unknown message');
			console.log(msg);
			}
		else
			console.log("unknown message received");
    });
  });