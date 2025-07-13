//// Test the server by opening websocket connections
//// then sending messages to check the server's response.

'use strict';

import { join } from './server.js';
import { assertEquals } from 'jsr:@std/assert';

Deno.test('get join acknowledgement', () => {
	const { type } = join('Player');
	assertEquals(type, 'join-ack');
});

Deno.test('confirm name on join', () => {
	const name = 'Player';
	const { name: messageName } = join('Player');
	assertEquals(messageName, name);
});

// Deno.test('TEMPLATE', () => {
// 	exampleFunc();
// });

// tests:
// - x join
// - id
//   - re/gen
// - disambig
// - disconn update conned players
// - rejoin update players
