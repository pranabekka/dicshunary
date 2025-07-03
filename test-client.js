'use strict';

const ws = new WebSocket(
	'ws://0.0.0.0:8000'
)

ws.onopen = (e) => {
	console.log('SOCKET OPEN');
	console.log(e);
	ws.send(
		JSON.stringify({event: 'join', name: 'nunya'})
	);
}

ws.onmessage = (e) => {
	console.log('SOCKET MESSAGE:');
	console.log(e.data);
	const message = JSON.parse(e.data);
	console.log(message);
}

ws.onerror = (e) => {
	console.error('SOCKET ERROR:');
	console.error(e);
}

ws.onclose = (e) => {
	console.log('SOCKET CLOSE:');
	console.log(e);
}
