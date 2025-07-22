'use strict';

import { assert } from 'jsr:@std/assert';

class Game {
	_playerStatus = {
		active: 'active-6b33e19',
		inactive: 'inactive-f956a13',
	}
	// player :: `player-${UUIDv4}`
	// players :: Map<player, {score: number, status: (playerStatus.active | playerStatus.inactive)}>
	_players = new Map();
	// giver :: player
	// rounds :: List<{giver, stage, word, Map<player, score>}>
	_stages = {
		giving: 'giving-a204b75',
		defining: 'defining-ed84077',
		voting: 'voting-227a041',
		scoring: 'scoring-5bcacd0',
	};
	_rounds = [];

	constructor() {
		this._roundNew();
	}

	// also adds player as new joinee
	playerNew() {
		const player = 'player-' + crypto.randomUUID();
		this._players.set(player, { score: 0, status: this._playerStatus.active });
		this._updateGiver(player);
		return player;
	}

	playerLeave(player) {
		this._players.get(player).status = this._playerStatus.inactive;
		this._updateGiver(player);
	}

	playerRejoin(player) {
		this._players.get(player).status = this._playerStatus.active;
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
		if (this._currentRoundGet().giver === null) {
			this._currentRoundGet().giver = player;
		} else if (player === this._currentRoundGet().giver) {
			this._currentRoundGet().giver = null;
			if (this._currentRoundGet().stage === this._stages.defining) {
				this._roundNew();
			}
			for (const [player, details] of this._players) {
				if (details.status === this._playerStatus.active) {
					this._currentRoundGet().giver = player;
					break;
				}
			}
		};
	}

	_nextStage(player) {
		const currentRound = this._currentRoundGet();
		const activePlayerCount = [...this._players.values()].filter(data => {
			return data.status === this._playerStatus.active;
		}).length;
		if (player !== currentRound.giver || activePlayerCount < 3) {
			return false;
		} else {
			switch (currentRound.stage) {
				case this._stages.giving:
					currentRound.stage = this._stages.defining;
					return true;
				case this._stages.defining:
					currentRound.stage = this._stages.voting;
					return true;
				case this._stages.voting:
					currentRound.stage = this._stages.scoring;
					return true;
				case this._stages.scoring:
					currentRound.stage = this._stages.giving;
					return true;
			}
		}
	}

	_currentRoundGet() {
		return this._rounds[this._rounds.length - 1];
	}

	_roundNew() {
		this._rounds.push(
			{ giver: null, stage: this._stages.giving }
		);
	}
}

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
