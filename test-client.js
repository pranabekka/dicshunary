'use strict';

const ws = new WebSocket(
	'ws://0.0.0.0:8000'
)

ws.onopen = (e) => {
	console.log('SOCKET OPEN');
	ws.send(
		JSON.stringify({event: 'join', name: 'nunya'})
	);
}

ws.onmessage = (e) => {
	console.log('SOCKET MESSAGE');
	const message = JSON.parse(e.data);
	console.log(message);
}

ws.onerror = (e) => {
	console.error('SOCKET ERROR');
}

ws.onclose = (e) => {
	console.log('SOCKET CLOSE');
}
