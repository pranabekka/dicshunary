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
				playerId = idGen('player');
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

			function idGen(tag) {
				const len = 15
				const chars = [
					'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
					'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
					'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
					'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F',
					'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
					'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
					'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
					'4', '5', '6', '7', '8', '9',
				]

				const parts = [tag, '-'];

				for (let i = 0; i < len; i++) {
					const randIdx = Math.floor(
						Math.random() * (chars.length - 1)
					);
					parts.push(chars[randIdx]);
				}

				return parts.join('');
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
