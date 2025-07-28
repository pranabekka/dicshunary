'use strict';

import { assert } from 'jsr:@std/assert';
import { Game } from './game.mjs';

Deno.test('update player active status on join', () => {
	const game = new Game();
	const player = game.playerNew();

	const expected = game._playerStatus.active;

	const result = game._players.get(player).status;
	assert(
		result === expected,
		`player active status should be "${expected}" on join. got "${result}"`
	);
});

Deno.test('update player status on leave', () => {
	const game = new Game();
	const player = game.playerNew();
	game.playerLeave(player);

	const expected = game._playerStatus.inactive;

	const result = game._players.get(player).status;
	assert(
		result === expected,
		`player status should be "${expected}" on leave. got "${result}"`
	);
});

Deno.test('update player status on rejoin', () => {
	const game = new Game();
	const player = game.playerNew();
	game.playerLeave(player);
	game.playerRejoin(player);

	const expected = game._playerStatus.active;

	const result = game._players.get(player).status;
	assert(
		result === expected,
		`player status should be "${expected}" on rejoin. got "${result}"`
	);
});

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

	const player2 = game.playerNew();
	const player3 = game.playerNew();
	game.playerLeave(player3);
	game._nextStage(player1);

	const resultActive = game._currentRoundGet().stage;
	assert(
		resultActive === expected,
		`game stage should be "${expected}" with less than three active players. got "${resultActive}"`
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

Deno.test('remove giver if they leave', () => {
	const expected = null;

	const game = new Game();
	const player = game.playerNew();
	game.playerLeave(player);

	const result = game._currentRoundGet().giver;
	assert(
		result === expected,
		`giver should be "${expected}" if last player leaves. got "${result}"`
	);
});

Deno.test('set player as giver if no other active', () => {
	const game = new Game();
	const player1 = game.playerNew();
	game.playerLeave(player1);
	const player2 = game.playerNew();

	const expected = player2;

	const result = game._currentRoundGet().giver;
	assert(
		result === expected,
		`giver should be "${expected}" if no other active players. got "${result}"`
	);
});

Deno.test('set giver to next active player if current leaves', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	game.playerLeave(player1);

	const expected = player2;

	const result = game._currentRoundGet().giver;
	assert(
		result === expected,
		`giver should be "${expected}" if previous leaves. got "${result}"`
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

Deno.test('do not set word if unable to progress stage', () => {
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

	game.playerLeave(player3);
	game.givingToGuessing(player1, 'notNuffActive');

	const resultNotMinActive = game._currentRoundGet().word;
	assert(
		resultNotMinActive === expected,
		`word should be "${expected}" without min active players. got "${resultNotMinActive}"`
	);
});

Deno.test('skip round if giver leaves during defining', () => {
	// expect to be on 2nd round
	const expected = 2;

	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	const player3 = game.playerNew();
	const player4 = game.playerNew();
	game.givingToGuessing(player1, 'leavingsoon');
	game.playerLeave(player1);

	const result = game._rounds.length;
	assert(
		result === expected,
		`expected to be on round ${expected}. got round ${result}`
	);
});

Deno.test('use next round after skipping first', () => {
	const word1 = 'first';
	const word2 = 'second';
	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	const player3 = game.playerNew();
	const player4 = game.playerNew();
	game.givingToGuessing(player1, word1);
	game.playerLeave(player1);
	game.givingToGuessing(player2, word2);

	const expectedWord = word2;
	const expectedGiver = player2;

	const resultWord = game._rounds[1].word;
	assert(
		resultWord === expectedWord,
		`expected ${expectedWord}. got ${resultWord}`
	);

	const resultGiver = game._rounds[1].giver;
	assert(
		resultGiver === expectedGiver,
		`expected ${expectedGiver}. got ${resultGiver}`
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
