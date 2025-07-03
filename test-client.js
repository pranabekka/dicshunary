'use strict';

let [name, id] = Deno.args.slice(0, 2)
if (name === undefined || id === undefined) {
	throw new Error('Name and ID required as CLI args');
}

function printInfo() {
	console.log('Name: ' + name);
	console.log('ID: ' + id);
}

const ws = new WebSocket(
	'ws://0.0.0.0:8000'
)

ws.onopen = (e) => {
	console.log('--- SOCKET OPEN ---');
	ws.send(
		JSON.stringify({event: 'join', name, id})
	);
}

ws.onmessage = (e) => {
	console.log('--- SOCKET MESSAGE ---');
	const message = JSON.parse(e.data);
	console.log(message);
	if (id === undefined) { id = message.id };
	printInfo();
}

ws.onerror = (e) => {
	console.error('--- SOCKET ERROR ---');
}

ws.onclose = (e) => {
	console.log('--- SOCKET CLOSE ---');
	printInfo();
}

Deno.addSignalListener('SIGINT', exitHandler)
Deno.addSignalListener('SIGTERM', exitHandler)
function exitHandler() {
	console.log('--- EXITING ---');
	printInfo();
	Deno.exit();
}
