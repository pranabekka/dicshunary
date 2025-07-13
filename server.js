'use strict';

// players :: { [playerID]: name }
export const players = {};

export function join(name, id) {
	const newId = 'player-' + crypto.randomUUID();
	players[newId] = name;
	return { type: 'join-ack', name, id: newId };
};
