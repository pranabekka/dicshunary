//// Test the server by opening websocket connections
//// then sending messages to check the server's response.

'use strict';

import { join } from './server.js';
import { assert } from 'jsr:@std/assert';

Deno.test('get join acknowledgement', () => {
	const { type } = join('Player');
	assert(type === 'join-ack');
});

Deno.test('confirm name on join', () => {
	const name = 'Player';
	const { name: messageName } = join('Player');
	assert(messageName === name, 'should return same name');
});

Deno.test('assign id on join', () => {
	const { id: messageId } = join('IWannaID');
	assert(
		typeof messageId === 'string',
		`expected "string", got "${typeof messageId}"`
	);
	assert(
		messageId.startsWith('player-'),
		`expected /player-.*/. got "${messageId}"`
	);
	assert(
		messageId.length === 43,
		`expected id length 43, got length "${messageId.length}" for "${messageId}"`
	);
	assert(
		messageId === 'player-54743dc5-e24d-4a41-bb15-9584c1226df6',
		'id with `deno test --seed 1` should be "player-54743dc5-e24d-4a41-bb15-9584c1226df6"'
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
