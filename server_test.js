'use strict';

import { Game } from './server.js';
import { assert } from 'jsr:@std/assert';

Deno.test('get join acknowledgement', () => {
	const game = new Game();
	const { type } = game.playerAdd('Player');
	assert(type === 'join-ack', 'should receive object with type "join-ack".');
});

Deno.test('confirm name on join', () => {
	const game = new Game();
	const name = 'Player';
	const { name: messageName } = game.playerAdd('Player');
	assert(messageName === name, `should return same name - "${name}". got "${messageName}"`);
});

Deno.test('assign id on join', () => {
	const game = new Game();
	const { id: messageId } = game.playerAdd('IWannID');
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
	const game = new Game();
	const { id } = game.playerAdd('SaveMe');
	assert(
		Object.keys(game.playersActive).includes(id),
		`players object should have entry with id`
	);
});

Deno.test('autofix name collision', () => {
	const game = new Game();
	const name = 'Colliding';
	const { name: name1 } = game.playerAdd(name);
	const { name: name2 } = game.playerAdd(name);
	assert(
		name1 != name2,
		`names should not be same. got "${name1}" and "${name2}"`
	);
});

Deno.test('disconnect players and save', () => {
	const game = new Game();
	const { id } = game.playerAdd('ImmaLeave');
	assert(
		Object.keys(game.playersActive).includes(id),
		`there should be an active player with provided id`
	);
	game.playerRemove(id);
	assert(
		!Object.keys(game.playersActive).includes(id),
		`there should be no active players`
	);
	assert(
		game.playersDisconnected.includes(id),
		`there should be a disconnected player`
	);
});

// Deno.test('+TEMPLATE+', () => {
// 	exampleFunc();
// });

// tests:
// - x join
// - ~ id
//   - re/gen
// - x disambig
// - x disconn update conned players
// - rejoin update players
