'use strict';

export function join(name, id) {
	return { type: 'join-ack', name, id };
};
