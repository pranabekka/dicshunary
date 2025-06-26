'use strict';

function httpHandler(req) {
	const clientFile = Deno.openSync('./client.html', { read: true });
	return new Response(clientFile.readable);
}

function wsHandler(req) {
	// just experimenting with destructuring and rebinding
	const { socket: ws, response: res } = Deno.upgradeWebSocket(req);

	ws.onopen = () => {
		console.log('conn');
	}

	ws.onmessage = (e) => {
		console.log(`rec: ${e.data}`);
		ws.send('howdy back to ya');
	}

	return res;
}

function handler(req) {
	if (req.headers.get('upgrade') != 'websocket') {
		return httpHandler(req);
	} else {
		return wsHandler(req);
	}
}

Deno.serve(handler);
