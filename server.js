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

	socket.onerror = (e) => {
		console.error('SOCKET ERROR');
		console.error(e.message);
		for (const playerId in players) {
			if (players[playerId].socket === socket) {
				console.error(playerId);
			}
		}
	}

	socket.onclose = (e) => {
		console.log('SOCKET CLOSE');
		for (const playerId in players) {
			if (players[playerId].socket === socket) {
				console.log(playerId);
			}
		}
	}

	socket.onmessage = (e) => {
		console.log(`SOCKET MESSAGE`);

		const message = JSON.parse(e.data);
		console.log(message);

		switch (message.event) {
			case 'join':
				joinHandler(message)
				break;
		}

		function joinHandler(message) {
			const newName = message.name;

			let newId;
			do {
				newId = 'player-' + crypto.randomUUID();
			} while (players[newId]);

			players[newId] = {name: newName, socket};

			// filter out socket and currently joining player
			const msgJoinAck = JSON.parse(
				JSON.stringify({
					type: 'join-ack',
					id: newId,
					players,
				})
			);
			delete msgJoinAck.players[newId];
			for (const player in msgJoinAck.players) {
				delete msgJoinAck.players[player].socket;
			}

			socket.send(
				JSON.stringify(msgJoinAck)
			);

			const msgNewPlayer = {
				type: 'new-player',
				id: newId,
				name: newName,
			}
			for (const playerId in players) {
				if (playerId !== newId) {
					players[playerId].socket.send(
						JSON.stringify(msgNewPlayer)
					)
				}
			}
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
