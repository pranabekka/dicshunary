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
		let id;
		let name;
		for (const playerId in players) {
			if (players[playerId].socket === socket) {
				id = playerId;
				name = players[playerId].name;
				delete players[playerId].socket;
				delete players[playerId].name;
				console.log(playerId);
				console.log('Player statuses:');
				console.log(JSON.parse(JSON.stringify(players)));
				break;
			}
		}

		// notify other players of disconnect
		const msgDisconn = JSON.parse(
			JSON.stringify({
				type: 'disconnect',
				id,
				name,
			})
		);
		for (const playerId in players) {
			if (playerId !== id) {
				if (players[playerId].socket !== undefined) {
					players[playerId].socket.send(
						JSON.stringify(msgDisconn)
					);
				} else {
					console.error(
						`%cERROR: %cPlayer not connected: ${playerId}.`
						+ ' SKIPPING disconnect notification',
						'color: red; font-weight: bold',
						''
					);
				}
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
			let name = message.name;
			let id;

			/// i want to iterate all players at least once
			/// and check their name doesn't match
			/// if it does match i change name and do it again
			/// if it doesn't match i move on
			let nameCollision = 'maybe';
			while (nameCollision == 'maybe') {
				// detect collision
				for (const playerId in players) {
					const playerName = players[playerId].name;
					if (name == playerName) {
						nameCollision = 'true';
					break;
					}
				}
				// resolve current collision
				if (nameCollision == 'true') {
					const suffixPartOpts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
					const suffixP1 = suffixPartOpts[Math.floor(Math.random() * suffixPartOpts.length)];
					const suffixP2 = suffixPartOpts[Math.floor(Math.random() * suffixPartOpts.length)];
					name = `${name} (${suffixP1}${suffixP2})`;
					nameCollision = 'maybe';
				} else {
					nameCollision = 'false';
				}
			}

			if (message.id === undefined) {
				id = 'player-' + crypto.randomUUID();
			} else {
				id = message.id
			}

			players[id] = {name, socket};

			// acknowledge new player
			// with list of other connected players
			// without socket keys
			const msgJoinAck = JSON.parse(
				JSON.stringify({
					type: 'join-ack',
					id,
					name,
					players,
					gameState,
				})
			);
			delete msgJoinAck.players[id];
			for (const playerId in msgJoinAck.players) {
				delete msgJoinAck.players[playerId].socket;
				if (msgJoinAck.players[playerId].name === undefined) {
					delete msgJoinAck.players[playerId];
				}
			}
			socket.send(
				JSON.stringify(msgJoinAck)
			);
			console.log(msgJoinAck);

			// notify other connected players of new player
			const msgNewPlayer = JSON.parse(
				JSON.stringify({
					type: 'new-player',
					id,
					name,
				})
			);
			for (const playerId in players) {
				if (playerId !== id) {
					// player is not self
					if (players[playerId].socket !== undefined) {
						// player is connected
						players[playerId].socket.send(
							JSON.stringify(msgNewPlayer)
						)
					} else {
						// player is not connected
						console.error(
							`%cERROR: %cPlayer not connected: ${playerId}.`
							+ ' SKIPPING new player notification',
							'color: red; font-weight: bold',
							''
						);
					}
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
