'use strict';

console.log('--- START ---');

let [name, id] = Deno.args.slice(0, 2)
if (name === undefined) {
	throw new Error('Name is required as CLI arg');
}

printInfo();

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
		JSON.stringify({type: 'join', name, id})
	);
}

ws.onmessage = (e) => {
	console.log('--- SOCKET MESSAGE ---');
	const message = JSON.parse(e.data);
	console.log(message);
	switch (message.type) {
		case 'join-ack':
			if (id === undefined) { id = message.id };
			if (name !== message.name) { name = message.name };
			printInfo();
			break;
		case 'new-player':
			console.log(`Hi, ${message.name}!`);
			break;
		default:
			console.error(
				`%cError:%c Unknown message type: ${message.type}`,
				'color: red; font-weight: bold',
				''
			);
	}
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
