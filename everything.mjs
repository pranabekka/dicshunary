'use strict';

import { assert } from 'jsr:@std/assert';

class Game {
	// players :: Map<id, {score: number, status: (active | departed)}>
	_players = new Map();
	// rounds :: List<Map<player, {definition, List<voter>}>>
	_rounds = [];
	_stages = [ 'giving', 'guessing', 'voting', 'scoring' ];
	_stage = this._stages[0];

	// also adds player as new joinee
	playerNew() {
		const player = new Player(this);
		this._players.set(player.id, { score: 0, status: 'active' });
		return player;
	}

	playerLeave(id) {
		const player = this._players.get(id);
		this._players.set(id, { score: player.score, status: 'departed' });
	}

	playerRejoin(id) {
		const player = this._players.get(id);
		this._players.set(id, { score: player.score, status: 'active' });
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

Deno.test('update player status on join', () => {
	const game = new Game();
	const player = game.playerNew();
	let playerStatus = game._players.get(player.id).status;
	assert(
		playerStatus === 'active',
		`player status should be "active". got "${playerStatus}"`
	);
});

Deno.test('update player status on leave', () => {
	const game = new Game();
	const player = game.playerNew();
	player.leave();
	let playerStatus = game._players.get(player.id).status;
	assert(
		playerStatus === 'departed',
		`player status should be "departed". got "${playerStatus}"`
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

// Deno.test('-TEMPLATE-', () => {
// 	const game = new Game();
// 	const player = game.playerNew();
// 	assert(
// 		-ASSERTION-,
// 		`-MESSAGE-`
// });
