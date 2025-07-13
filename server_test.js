//// Test the server by opening websocket connections
//// then sending messages to check the server's response.

'use strict';

import * as server from './server.js';
import { assert } from 'jsr:@std/assert';

Deno.test('get join acknowledgement', () => {
	const { type } = server.join('Player');
	assert(type === 'join-ack', 'should receive object with type "join-ack".');
});

Deno.test('confirm name on join', () => {
	const name = 'Player';
	const { name: messageName } = server.join('Player');
	assert(messageName === name, 'should return same name');
});

Deno.test('assign id on join', () => {
	const { id: messageId } = server.join('IWannaID');
	assert(
		typeof messageId === 'string',
		`id should be "string". got "${typeof messageId}"`
	);
	assert(
		messageId.startsWith('player-'),
		`id should match /player-.*/. got "${messageId}"`
	);
	assert(
		messageId.length === 43,
		`id length should be 43. got "${messageId.length}" for "${messageId}"`
	);
	assert(
		messageId === 'player-54743dc5-e24d-4a41-bb15-9584c1226df6',
		'id with `deno test --seed 1` should be "player-54743dc5-e24d-4a41-bb15-9584c1226df6"'
	);
});

Deno.test('store players', () => {
	const { id } = server.join('SaveMe');
	assert(
		Object.keys(server.players).includes(id),
		`players object should have entry with id`
	);
});

// Deno.test('TEMPLATE', () => {
// 	exampleFunc();
// });

// tests:
// - x join
// - ~ id
//   - re/gen
// - disambig
// - disconn update conned players
// - rejoin update players
