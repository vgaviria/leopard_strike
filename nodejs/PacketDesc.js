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