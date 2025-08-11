'use strict';

import { assert } from 'jsr:@std/assert';
import { Game } from './game.mjs';

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

Deno.test('switch stage', () => {
	const game = new Game();

	const expected = game._stages.defining;

	game.playerNew();
	game.playerNew();
	game.playerNew();
	game.playerNew();
	game.givingToGuessing('eecksampul');

	const result = game._currentRoundGet().stage;
	assert(
		result === expected,
		`game stage should be "${expected}" if giver. got "${result}"`
	);
});

Deno.test('set word when given', () => {
	const expected = 'wurd';

	const game = new Game();
	game.playerNew();
	game.playerNew();
	game.playerNew();
	const word = expected;
	game.givingToGuessing(word);

	const result = game._currentRoundGet().word;
	assert(
		result === word,
		`word should be "${word}". got "${result}"`
	);
});

// NOTE: this test might be flaky?
// i'm comparing objects as maps by JSON string representation
Deno.test('save player definitions to round', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	const player3 = game.playerNew();
	game.givingToGuessing('thingummy');
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
