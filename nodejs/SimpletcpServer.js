function tcpcallback(c){
	console.log('server connected');
	c.on('end', function(){
		var index= sockets.indexOf(c);
		if(index>-1){
			sockets.splice(index,1);
		}
		console.log('server disconnected');
	});
	sockets.push(c);
	c.write('hello\r\n');
	c.pipe(c);
}

var net = require('net');
var tcpserver = net.createServer(tcpcallback);
var sockets = new Array();
tcpserver.listen(8124, function(){
	console.log('server bound');
});