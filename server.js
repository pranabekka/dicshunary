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
		console.log({playersActive});
		console.log({playersInactive});

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
			socket.send(
				util.msgMake('join-ack', { id, name })
			);

			// notify other active players of
			// re/joining player
			{
				const msgJoinRejoin = util.msgMake(
					'join/rejoin', { joinType, id, name }
				);
				for (const playerId in playersActive) {
					// player is not self
					if (playerId !== id) {
						playersActive[playerId].socket.send( msgJoinRejoin );
					}
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
	},

	objCopy(obj) {
		return JSON.parse(
			JSON.stringify(obj)
		);
	},

	// always put data as object
	// so that i get keys to work with.
	// always return json as string
	msgMake(type, data) {
		switch (type) {
			case 'join-ack':
				const msgJoinAck = util.objCopy({
					type: 'join-ack',
					id: data.id,
					name: data.name,
					players: playersActive,
					gameState,
				});

				// player's own info is going directly in message
				delete msgJoinAck.players[data.id];

				// json doesn't serialise socketinfo
				// but it's cleaner to remove it
				// than deal with extra fields on client
				for (const playerId in msgJoinAck.players) {
					delete msgJoinAck.players[playerId].socket;
				}

				return JSON.stringify(msgJoinAck);
				break;

			case 'join/rejoin':
				const msgJoinRejoin = {
					type: data.joinType,
					id: data.id,
					name: data.name,
				}

				return JSON.stringify(msgJoinRejoin);
				break;

			default:
				console.error(
					`%cERROR:%c Unknown message type: {type}`,
					'color: red; font-weight: bold',
					''
				);
				console.error({data});
				Deno.exit();
		}
	}
};
