PacketTypes= {
	OPENPAGE:1, 		// params url - CLIENT
	CLIENTLIST:2,		// params clients - SERVER
	JOINGAME:3,			// params url, checksum - CLIENT
	CREATEPLAYER:4,		// params pid, x, y, rgb -SERVER
	UPDATEPLAYER:5,		// params pid, x,y, deg -SERVER & CLIENT
	CREATEFX:6,			// params CreateFXParams -SERVER
	DAMAGEPLAYER:7,		// params playerid, hp -SERVER
	SETPLAYERID:8,		// params pid -SERVER
	FIREBULLET:9,		// params pid, x, y, deg - CLIENT
	DELETEPLAYER:10,	// params pid -SERVER
	LEAVEROOM:11,		// params pid -CLIENT
};

Packet = function(type){
	this.type=type;
}

User = function(id, sock){
	this.id=id;
	this.sock=sock;
}

Page = function(url){
	this.url=url;
	this.num=0;
}

Room = function(id){
	this.id=id;
	this.numPlayers=0;
	this.players={};
	this.bullets=[];
}

Bullet = function(x,y,vx,vy,size){
	this.x=x;
	this.y=y;
	this.vx=vx;
	this.vy=vy;
	this.size=size;
}

Room.prototype.addPlayer= 
		function(player){
			this.numPlayers=this.numPlayers+1;
			this.players[this.numPlayers]=player;
			player.pid=this.numPlayers;
		};