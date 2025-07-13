'use strict';

export function join(name, id) {
	const newId = 'player-' + crypto.randomUUID();
	return { type: 'join-ack', name, id: newId };
};
