'use strict';

import { assert } from 'jsr:@std/assert';
import { Game } from './game.mjs';

Deno.test('enforce minimum active player count for switching stage', () => {
	const game = new Game();
	game._nextStage();

	const expected = game._stages.giving;

	const resultNoPlayers = game._currentRoundGet().stage;
	assert(
		resultNoPlayers === expected,
		`game stage should be "${expected}" with 0 players. got "${resultNoPlayers}"`
	);

	const player1 = game.playerNew();
	game._nextStage(player1);

	const resultOnePlayer = game._currentRoundGet().stage;
	assert(
		resultOnePlayer === expected,
		`game stage should be "${expected}" with 1 player (less than 3). got "${resultOnePlayer}"`
	);
});

Deno.test('set first player as giver', () => {
	const game = new Game();
	const player = game.playerNew();

	const expected = player;

	const result = game._currentRoundGet().giver;
	assert(
		result === expected,
		`giver should be "${expected}" if first player. got "${result}"`
	);
});

Deno.test('switch stage if giver issues command', () => {
	const game = new Game();

	const expected = game._stages.defining;

	const player1 = game.playerNew();
	const _player2 = game.playerNew();
	const _player3 = game.playerNew();
	const _player4 = game.playerNew();
	game.givingToGuessing(player1, 'eecksampul');

	const result = game._currentRoundGet().stage;
	assert(
		result === expected,
		`game stage should be "${expected}" if giver. got "${result}"`
	);
});

Deno.test('do not switch stage if min players met but player not giver', () => {
	const game = new Game();

	const expected = game._stages.giving;

	const _player1 = game.playerNew();
	const player2 = game.playerNew();
	const _player3 = game.playerNew();
	const _player4 = game.playerNew();
	game.givingToGuessing(player2, 'bad');

	const result = game._currentRoundGet().stage;
	assert(
		result === expected,
		`game stage should be "${expected}" if not giver. got "${result}"`
	);
});

Deno.test('set word from giver in game', () => {
	const expected = 'wurd';

	const game = new Game();
	const player1 = game.playerNew();
	const _player2 = game.playerNew();
	const _player3 = game.playerNew();
	const word = expected;
	game.givingToGuessing(player1, word);

	const result = game._currentRoundGet().word;
	assert(
		result === word,
		`word should be "${word}" when sent by giver. got "${result}"`
	);
});

Deno.test('do not set word if not giver', () => {
	const expected = undefined;

	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	const player3 = game.playerNew();
	game.givingToGuessing(player2, 'notGiverI');

	const resultNotGiver = game._currentRoundGet().word;
	assert(
		resultNotGiver === expected,
		`word should be "${expected}" with non-giver. got "${resultNotGiver}"`
	);
});

// NOTE: this test might be flaky?
// i'm comparing objects as maps by JSON string representation
Deno.test('save player definitions to round', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	const player3 = game.playerNew();
	game.givingToGuessing(player1, 'thingummy');
	const definition1 = 'the correct definition';
	const definition2 = 'a made up definition';
	const definition3 = 'also a made up definition';
	game.definitionSubmit(player1, definition1);
	game.definitionSubmit(player2, definition2);
	game.definitionSubmit(player3, definition3);

	const expected = JSON.stringify({
		[player1]: definition1,
		[player2]: definition2,
		[player3]: definition3,
	});

	const result = JSON.stringify(game._currentRoundGet().definitions);
	assert(
		result === expected,
		`expected ${expected} for definition submissions. got ${result}`
	);
});

// Deno.test('-TEMPLATE-', () => {
// 	const expected = ;
//
// 	const game = new Game();
// 	const player = game.playerNew();
//
// 	const result = ;
// 	assert(
// 		result === expected,
// 		`expected ${expected}. got ${result}`
// 	);
// });
