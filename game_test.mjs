'use strict';

import { assert } from 'jsr:@std/assert';
import { Game } from './game.mjs';

Deno.test('set first player as giver', () => {
	const game = new Game();
	game.playerJoin();
	const player = Object.keys(game._players)[0];

	const expected = player;

	const result = game._currentRoundGet().giver;
	assert(
		result === expected,
		`giver should be "${expected}" if first player. got "${result}"`
	);
});

Deno.test('switch stage to defining when word is given', () => {
	const game = new Game();

	const expected = game._stages.defining;

	game.playerJoin();
	game.playerJoin();
	game.playerJoin();
	game.playerJoin();
	game.wordGive('eecksampul');

	const result = game._currentRoundGet().stage;
	assert(
		result === expected,
		`game stage should be "${expected}" if giver. got "${result}"`
	);
});

Deno.test('set word when given', () => {
	const expected = 'wurd';

	const game = new Game();
	game.playerJoin();
	game.playerJoin();
	game.playerJoin();
	const word = expected;
	game.wordGive(word);

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
	game.playerJoin();
	game.playerJoin();
	game.playerJoin();
	const [player1, player2, player3] = Object.keys(game._players);
	game.wordGive('thingummy');
	const definition1 = 'the correct definition';
	const definition2 = 'a made up definition';
	const definition3 = 'also a made up definition';
	game.definitionGive(player1, definition1);
	game.definitionGive(player2, definition2);
	game.definitionGive(player3, definition3);

	const expected = JSON.stringify([
		{ author: player1, body: definition1 },
		{ author: player2, body: definition2 },
		{ author: player3, body: definition3 },
	]);

	const result = JSON.stringify(game._currentRoundGet().definitions);
	assert(
		result === expected,
		`expected ${expected} for definition submissions. got ${result}`
	);
});

Deno.test('switch stage to voting when all players give definition', () => {
	const game = new Game();

	const expected = game._stages.voting;

	game.playerJoin();
	game.playerJoin();
	game.playerJoin();
	game.wordGive('word');
	const [player1, player2, player3] = Object.keys(game._players);
	game.definitionGive(player1, 'a definition');
	game.definitionGive(player2, 'a definition');
	game.definitionGive(player3, 'a definition');

	const result = game._currentRoundGet().stage;
	assert(
		result === expected,
		`expected stage ${expected}. got ${result}`
	);
});

Deno.test('save votes to round', () => {
	const game = new Game();

	game.playerJoin();
	game.playerJoin();
	game.playerJoin();
	game.wordGive('word');
	const [player1, player2, player3] = Object.keys(game._players);
	game.definitionGive(player1, 'a definition');
	game.definitionGive(player2, 'a definition');
	game.definitionGive(player3, 'a definition');
	game.voteGive(player2, player3);
	game.voteGive(player3, player2);

	const expected = 2;

	const result = Object.keys(game._currentRoundGet().votes).length;
	assert(
		result === expected,
		`expected ${expected} votes. got ${result}`
	);
});

Deno.test('switch stage to scoring when all guessers vote', () => {
	const game = new Game();

	const expected = game._stages.scoring;

	game.playerJoin();
	game.playerJoin();
	game.playerJoin();
	game.wordGive('word');
	const [player1, player2, player3] = Object.keys(game._players);
	game.definitionGive(player1, 'a definition');
	game.definitionGive(player2, 'a definition');
	game.definitionGive(player3, 'a definition');
	game.voteGive(player2, player3);
	game.voteGive(player3, player2);

	const result = game._currentRoundGet().stage;
	assert(
		result === expected,
		`expected stage to be ${expected}. got ${result}`
	);
});

// Deno.test('-TEMPLATE-', () => {
// 	const expected = -;
//
// 	const game = new Game();
//
// 	game.playerJoin();
//
// 	const result = -;
// 	assert(
// 		result === expected,
// 		`expected ${expected}. got ${result}`
// 	);
// });
