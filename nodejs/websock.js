var io = require('socket.io').listen(80);

io.sockets.on('connection', function (socket) {
	console.log('user connected');
	socket.on('message', function (msg) { socket.send(msg);});
	socket.on('disconnect', function () { console.log('user disconnected');});
});