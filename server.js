'use strict';

// :: { [key: playerId]: {socket, name} }
const players = {};

function httpHandler(req) {
	const clientFile = Deno.openSync('./client.html', { read: true });
	return new Response(clientFile.readable);
}

function wsHandler(req) {
	const { socket, response } = Deno.upgradeWebSocket(req);

	socket.onopen = (e) => {
		console.log('NEW CONN');
	}

	socket.onmessage = (e) => {
		console.log(`REC'D: ${e.data}`);

		const message = JSON.parse(e.data);

		switch (message.event) {
			case 'join':
				joinHandler(message)
				break;
		}

		function joinHandler(message) {
			const playerName = message.name;

			let playerId;
			do {
				playerId = 'player-' + crypto.randomUUID();
			} while (players[playerId]);

			players[playerId] = {name: playerName, socket};

			// filter out socket and currently joining player
			const messageOut = JSON.parse(
				JSON.stringify({
					type: 'join-ack',
					id: playerId,
					players,
				})
			);
			for (const player in messageOut.players) {
				delete messageOut.players[player].socket;
			}
			console.log(messageOut.players);
			delete messageOut.players[playerId];

			socket.send(
				JSON.stringify(messageOut)
			);
		}
	}

	return response;
}

function handler(req) {
	if (req.headers.get('upgrade') != 'websocket') {
		return httpHandler(req);
	} else {
		return wsHandler(req);
	}
}

Deno.serve(handler);
