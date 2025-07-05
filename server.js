'use strict';

// :: { [key: playerId]: {socket, name} }
const playersActive = {};
// :: [playerId]
const playersInactive = [];
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
		for (const playerId in playersActive) {
			if (playersActive[playerId].socket === socket) {
				console.error(playerId);
			}
		}
	}

	socket.onclose = (e) => {
		console.log('--- SOCKET CLOSE ---');
		let id;
		let name;
		// find and log which socket closed
		for (const playerId in playersActive) {
			if (playersActive[playerId].socket === socket) {
				id = playerId;
				name = playersActive[playerId].name;
				console.log('Disconnected: ' + id);
				break;
			}
		}
		// move from connected to disconnected list
		delete playersActive[id];
		// socket becomes invalid,
		// and name with suffix might be pointless
		playersInactive.push(id);
		console.log(JSON.parse(JSON.stringify({playersActive})));
		console.log(JSON.parse(JSON.stringify({playersInactive})));

		// notify other players of disconnect
		for (const playerId in playersActive) {
			playersActive[playerId].socket.send(
				JSON.stringify({
					type: 'disconnect',
					id,
					name,
				})
			);
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
			const name = util.nameDisambiguate(message.name);
			const joinType = playersInactive.includes(message.id)
				? 'rejoin'
				: 'new-player';
			const id = joinType === 'rejoin'
				? message.id
				: 'player-' + crypto.randomUUID();
			console.log({name, joinType, id})

			// remove from disconn list if rejoin
			if (joinType == 'rejoin') {
				const i = playersInactive.indexOf(id);
				playersInactive.splice(i, 1);
			}

			// add player to active players, rejoin or no
			playersActive[id] = {name, socket};

			// acknowledge re/joining player
			// with disambiguated name,
			// new/existing id,
			// and game info
			const msgJoinAck = JSON.parse(
				JSON.stringify({
					type: 'join-ack',
					id,
					name,
					players: playersActive,
					gameState,
				})
			);
			delete msgJoinAck.players[id];
			for (const playerId in msgJoinAck.players) {
				delete msgJoinAck.players[playerId].socket;
			}
			socket.send(
				JSON.stringify(msgJoinAck)
			);

			// notify other active players of
			// re/joining player
			const msgJoinRejoin = JSON.parse(
				JSON.stringify({
					type: joinType,
					id,
					name,
				})
			);
			for (const playerId in playersActive) {
				// player is not self
				if (playerId !== id) {
					playersActive[playerId].socket.send(
						JSON.stringify(msgJoinRejoin)
					)
				}
			}

			console.log({playersActive});
			console.log({playersInactive});
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

const util = {
	nameDisambiguate(name) {
		let nameCollision = 'maybe';

		while (nameCollision == 'maybe') {
			// detect collision
			for (const playerId in playersActive) {
				const playerName = playersActive[playerId].name;
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

		return name;
	}
};
