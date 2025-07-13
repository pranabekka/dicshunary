//// Test the server by opening websocket connections
//// then sending messages to check the server's response.

'use strict';

import { join } from './server.js';
import { assertEquals } from 'jsr:@std/assert';

Deno.test('get join acknowledgement', () => {
	const { type } = join('Player One');
	assertEquals(type, 'join-ack');
});

// tests:
// - ~ join
// - x id
//   - x re/gen
// - disambig
// - disconn update conned players
// - rejoin update players
