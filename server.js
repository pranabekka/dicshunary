'use strict';

// :: { [key: playerId]: {socket, name} }
const players = {};
// start game in lobby
const gameState = 'LOBBY';

function httpHandler(req) {
	const clientFile = Deno.openSync('./client.html', { read: true });
	return new Response(clientFile.readable);
}

function wsHandler(req) {
	const { socket, response } = Deno.upgradeWebSocket(req);

	socket.onopen = (e) => {
		console.log('--- NEW CONN ---');
	}

	socket.onerror = (e) => {
		console.error('--- SOCKET ERROR ---');
		console.error(e.message);
		// find and log which socket had an error
		for (const playerId in players) {
			if (players[playerId].socket === socket) {
				console.error(playerId);
			}
		}
	}

	socket.onclose = (e) => {
		console.log('--- SOCKET CLOSE ---');
		// find and log which socket closed
		for (const playerId in players) {
			if (players[playerId].socket === socket) {
				console.log(playerId);
			}
		}
	}

	socket.onmessage = (e) => {
		console.log(`--- SOCKET MESSAGE ---`);

		const message = JSON.parse(e.data);
		console.log(message);

		switch (gameState) {
			case 'LOBBY':
				console.log(`=== ${gameState} ===`);
				switch (message.type) {
					case 'join':
						lobbyJoinHandler(message);
						break;
				}
				break;
			default:
				console.error(
					`%cERROR: %cUnknown state: ${gameState}`,
					'color: red; font-weight: bold',
					''
				);
				Deno.exit();
		}

		function lobbyJoinHandler(message) {
			const name = message.name;
			let id;

			if (message.id === undefined) {
				id = 'player-' + crypto.randomUUID();
			} else {
				id = message.id
			}

			players[id] = {name, socket};

			// acknowledge new player
			// with list of other players
			// without socket keys
			const msgJoinAck = JSON.parse(
				JSON.stringify({
					type: 'join-ack',
					id,
					players,
					gameState,
				})
			);
			delete msgJoinAck.players[id];
			for (const player in msgJoinAck.players) {
				delete msgJoinAck.players[player].socket;
			}
			socket.send(
				JSON.stringify(msgJoinAck)
			);

			// notify previous players of new player
			const msgNewPlayer = {
				type: 'new-player',
				id,
				name,
			}
			for (const playerId in players) {
				if (playerId !== id) {
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
