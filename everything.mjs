'use strict';

import { assert } from 'jsr:@std/assert';

class Game {
	// player :: `player-${UUIDv4}`
	// players :: Map<player, {score: number, status: (active | inactive)}>
	_players = new Map();
	// giver :: player
	// rounds :: List<{giver, stage, word, Map<player, score>}>
	_stages = [ 'giving', 'defining', 'voting', 'scoring' ];
	_rounds = [
		{giver: null, stage: this._stages[0]},
	];

	// also adds player as new joinee
	playerNew() {
		const player = 'player-' + crypto.randomUUID();
		this._players.set(player, { score: 0, status: 'active' });
		this._updateGiver(player);
		return player;
	}

	playerLeave(player) {
		this._players.get(player).status = 'inactive';
		this._updateGiver(player);
	}

	playerRejoin(player) {
		this._players.get(player).status = 'active';
		this._updateGiver(player);
	}

	givingToGuessing(player, word) {
		const progress = this._nextStage(player);
		if (progress === true) {
			const currentRound = this._currentRoundGet();
			currentRound.word = word;
		}
	}

	_updateGiver(player) {
		const currentRound = this._currentRoundGet();
		if (currentRound.giver === null) {
			currentRound.giver = player;
		} else if (player === currentRound.giver) {
			currentRound.giver = null;
			for (const [player, details] of this._players) {
				if (details.status === 'active') {
					currentRound.giver = player;
					break;
				}
			}
		};
	}

	_nextStage(player) {
		const currentRound = this._currentRoundGet();
		const activePlayerCount = [...this._players.values()].filter(data => {
			return data.status === 'active';
		}).length;
		if (player !== currentRound.giver || activePlayerCount < 3) {
			return false;
		} else {
			const idxCurr = this._stages.indexOf(currentRound.stage);
			const idxNext = idxCurr === this._stages.length - 1 ?
				0 : idxCurr + 1;
			currentRound.stage = this._stages[idxNext];
			return true;
		}
	}

	_currentRoundGet() {
		return this._rounds[this._rounds.length - 1];
	}
}

Deno.test('update player active status on join', () => {
	const game = new Game();
	const player = game.playerNew();
	const playerStatus = game._players.get(player).status;
	const expected = 'active';
	assert(
		playerStatus === expected,
		`player active status should be "${expected}". got "${playerStatus}"`
	);
});

Deno.test('update player status on leave', () => {
	const game = new Game();
	const player = game.playerNew();
	game.playerLeave(player);
	const playerStatus = game._players.get(player).status;
	const expected = 'inactive';
	assert(
		playerStatus === expected,
		`player status should be "${expected}". got "${playerStatus}"`
	);
});

Deno.test('update player status on rejoin', () => {
	const game = new Game();
	const player = game.playerNew();
	game.playerLeave(player);
	game.playerRejoin(player);
	const playerStatus = game._players.get(player).status;
	assert(
		playerStatus === 'active',
		`player status should be "active". got "${playerStatus}"`
	);
});

Deno.test('enforce minimum active player count for switching stage', () => {
	const game = new Game();
	game._nextStage();
	const expected = game._stages[0];
	let currentRound = game._currentRoundGet();
	assert(
		currentRound.stage === expected,
		`game stage should be "${expected}" with 0 players. got "${currentRound.stage}"`
	);
	const player1 = game.playerNew();
	game._nextStage(player1);
	currentRound = game._currentRoundGet();
	assert(
		currentRound.stage === expected,
		`game stage should be "${expected}" with 1 player (less than 3). got "${currentRound.stage}"`
	);
	const player2 = game.playerNew();
	const player3 = game.playerNew();
	game.playerLeave(player3);
	game._nextStage(player1);
	currentRound = game._currentRoundGet();
	assert(
		currentRound.stage === expected,
		`game stage should be "${expected}" with less than three active players. got "${currentRound.stage}"`
	);
});

Deno.test('set first player as giver', () => {
	const game = new Game();
	const player = game.playerNew();
	const expected = player;
	const currentRound = game._currentRoundGet();
	assert(
		currentRound.giver === expected,
		`giver should be "${expected}". got "${currentRound.giver}"`
	);
});

Deno.test('remove giver if they leave', () => {
	const game = new Game();
	const player = game.playerNew();
	game.playerLeave(player);
	const expected = null;
	const currentRound = game._currentRoundGet();
	assert(
		currentRound.giver === expected,
		`giver should be "${expected}". got "${currentRound.giver}"`
	);
});

Deno.test('set player as giver if no other active', () => {
	const game = new Game();
	const player1 = game.playerNew();
	game.playerLeave(player1);
	const player2 = game.playerNew();
	const expected = player2;
	const currentRound = game._currentRoundGet();
	assert(
		currentRound.giver === expected,
		`giver should be "${expected}". got "${currentRound.giver}"`
	);
});

Deno.test('set giver to next active player if current leaves', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	game.playerLeave(player1);
	const expected = player2;
	const currentRound = game._currentRoundGet();
	assert(
		currentRound.giver === expected,
		`giver should be "${expected}". got "${currentRound.giver}"`
	);
});

Deno.test('switch stage if giver issues command', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const _player2 = game.playerNew();
	const _player3 = game.playerNew();
	const _player4 = game.playerNew();
	game.givingToGuessing(player1, 'eecksampul');
	const expected = game._stages[1];
	const currentRound = game._currentRoundGet();
	assert(
		currentRound.stage === expected,
		`game stage should be "${expected}". got "${currentRound.stage}"`
	);
});

Deno.test('do not switch stage if min players met but player not giver', () => {
	const game = new Game();
	const _player1 = game.playerNew();
	const player2 = game.playerNew();
	const _player3 = game.playerNew();
	const _player4 = game.playerNew();
	game.givingToGuessing(player2, 'bad');
	const currentRound = game._currentRoundGet();
	const expected = game._stages[0];
	assert(
		currentRound.stage === expected,
		`game stage should be "${expected}". got "${currentRound.stage}"`
	);
});

Deno.test('set word from giver in game', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const _player2 = game.playerNew();
	const _player3 = game.playerNew();
	const word = 'wurd';
	game.givingToGuessing(player1, word);
	const currentRound = game._currentRoundGet();
	assert(
		currentRound.word === word,
		`word should be "${word}". got "${currentRound.word}"`
	);
});

Deno.test('do not set word if unable to progress stage', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	const player3 = game.playerNew();
	const word = 'wurd';
	game.givingToGuessing(player2, word);
	const expected = undefined;
	const currentRound = game._currentRoundGet();
	assert(
		currentRound.word === expected,
		`word should be "${expected}". got "${currentRound.word}"`
	);
	game.playerLeave(player3);
	game.givingToGuessing(player1, word);
	assert(
		currentRound.word === expected,
		`word should be "${expected}". got "${currentRound.word}"`
	);
});

// Deno.test('-TEMPLATE-', () => {
// 	const game = new Game();
// 	const player = game.playerNew();
// 	assert(
// 		-ASSERTION-,
// 		`-MESSAGE-`
// 	);
// });
