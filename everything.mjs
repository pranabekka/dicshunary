'use strict';

import { assert } from 'jsr:@std/assert';

class Game {
	// players :: Map<id, {score: number, status: (active | inactive)}>
	_players = new Map();
	// rounds :: List<Map<player, {definition, List<voter>}>>
	_rounds = [];
	_stages = [ 'giving', 'guessing', 'voting', 'scoring' ];
	_stage = this._stages[0];
	_giver;

	// also adds player as new joinee
	playerNew() {
		const player = new Player(this);
		this._players.set(player.id, { score: 0, status: 'active' });
		if (this._giver === undefined || this._giver === null) {
			this._giver = player.id;
		};
		return player;
	}

	playerLeave(id) {
		const player = this._players.get(id);
		this._players.set(id, { score: player.score, status: 'inactive' });
		if (this._giver === id) {
			this._giver = null;
			for (const [player, details] of this._players) {
				if (details.status === 'active') {
					this._giver = player;
					break;
				}
			}
		}
	}

	playerRejoin(id) {
		const player = this._players.get(id);
		this._players.set(id, { score: player.score, status: 'active' });
		if (this._giver === undefined || this._giver === null) {
			this._giver = player.id;
		};
	}

	nextStage() {
		if (this._players.size < 3) {
			return;
		} else {
			const idx = this._stages.indexOf(this._stage);
			const next = idx === this._stages.length - 1 ?
				0 : idx + 1;
			this._stage = this._stages[next];
		}
	}
}

class Player {
	constructor(game) {
		this.game = game;
		this.id = 'player-' + crypto.randomUUID();
	}

	leave() {
		this.game.playerLeave(this.id);
	}

	rejoin() {
		this.game.playerRejoin(this.id);
	}
}

Deno.test('update player active status on join', () => {
	const game = new Game();
	const player = game.playerNew();
	const playerStatus = game._players.get(player.id).status;
	const expected = 'active';
	assert(
		playerStatus === expected,
		`player active status should be "${expected}". got "${playerStatus}"`
	);
});

Deno.test('update player status on leave', () => {
	const game = new Game();
	const player = game.playerNew();
	player.leave();
	const playerStatus = game._players.get(player.id).status;
	const expected = 'inactive';
	assert(
		playerStatus === expected,
		`player status should be "${expected}". got "${playerStatus}"`
	);
});

Deno.test('update player status on rejoin', () => {
	const game = new Game();
	const player = game.playerNew();
	player.leave();
	player.rejoin();
	let playerStatus = game._players.get(player.id).status;
	assert(
		playerStatus === 'active',
		`player status should be "active". got "${playerStatus}"`
	);
});

Deno.test('enforce minimum player count for switching stage', () => {
	const game = new Game();
	const stage = game._stage;
	game.nextStage();
	assert(
		game._stage === stage,
		`game stage should be "${stage}" with less than three players. got "${game._stage}"`
	);
});

Deno.test('set first player as giver', () => {
	const game = new Game();
	const player = game.playerNew();
	const expected = player.id;
	assert(
		game._giver === expected,
		`giver should be "${expected}". got "${game._giver}"`
	);
});

Deno.test('remove giver if they leave', () => {
	const game = new Game();
	const player = game.playerNew();
	player.leave();
	const expected = null;
	assert(
		game._giver === expected,
		`giver should be "${expected}". got "${game._giver}"`
	);
});

Deno.test('set player as giver if no other active', () => {
	const game = new Game();
	const player1 = game.playerNew();
	player1.leave();
	const player2 = game.playerNew();
	const expected = player2.id;
	assert(
		game._giver === expected,
		`giver should be "${expected}". got "${game._giver}"`
	);
});

Deno.test('set giver to next active player if current leaves', () => {
	const game = new Game();
	const player1 = game.playerNew();
	const player2 = game.playerNew();
	player1.leave();
	const expected = player2.id;
	assert(
		game._giver === expected,
		`giver should be "${expected}". got "${game._giver}"`
	);
});

// Deno.test('-TEMPLATE-', () => {
// 	const game = new Game();
// 	const player = game.playerNew();
// 	assert(
// 		-ASSERTION-,
// 		`-MESSAGE-`
// });
