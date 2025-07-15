'use strict';

import { Game } from './game.mjs';
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
	const name = 'ImmaLeave';
	const { id } = game.playerAdd(name);
	assert(
		Object.keys(game.playersActive).includes(id),
		`there should be an active player with provided id`
	);
	game.playerRemove(id);
	assert(
		Object.keys(game.playersActive).length === 0,
		`there should be no active players`
	);
	assert(
		Object.keys(game.playersDisconnected).length === 1,
		`there should be one disconnected player`
	);
	const savedName = game.playersDisconnected[id].name;
	assert(
		name === savedName,
		`disconnected name should match "${name}". got "${savedName}"`
	);
});

Deno.test('autofix name collision with disconnected players', () => {
	const game = new Game();
	const name = 'Leave n Collide';
	const player1 = game.playerAdd(name);
	game.playerRemove(player1.id);
	const player2 = game.playerAdd(name);
	assert(
		player2.name !== player1.name,
		`active player names should not match disconnected.`
	);
});

Deno.test('save player scores', () => {
	const game = new Game();
	const { id } = game.playerAdd('Player');
	assert(
		game.playersActive[id].score !== undefined,
		'assert player should have a score (even 0)'
	);
});

Deno.test('move player back to active list on rejoin', () => {
	const game = new Game();
	const name = 'ShallRejoin';
	const { id: session1Id } = game.playerAdd(name);
	game.playerRemove(session1Id);
	const { id: session2Id } = game.playerAdd(name, session1Id);
	assert(
		session1Id === session2Id,
		'player id should remain same on rejoin'
	);
	assert(
		Object.keys(game.playersDisconnected).length === 0,
		'there should be no disconnected players'
	);
	assert(
		Object.keys(game.playersActive).length === 1,
		'there should be one active player'
	);
});

Deno.test('order active players by re/joining', () => {
	const game = new Game();
	const player1 = game.playerAdd('The first');
	const player2 = game.playerAdd('The second');
	assert(
		player1.id === Object.keys(game.playersActive)[0],
		`first player should be "${player1}". got "${Object.entries(game.playersActive)[0]}"`
	);
	assert(
		player2.id === Object.keys(game.playersActive)[1],
		`second player should be "${player1}". got "${Object.entries(game.playersActive)[0]}"`
	);
	const player3 = game.playerAdd('The third');
	game.playerRemove(player1.id);
	assert(
		player2.id === Object.keys(game.playersActive)[0],
		`first player should be "${player2}". got "${Object.entries(game.playersActive)[0]}"`
	);
	assert(
		player3.id === Object.keys(game.playersActive)[1],
		`second player should be "${Object.entries(player3)}". got "${Object.entries(game.playersActive)[0]}"`
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
