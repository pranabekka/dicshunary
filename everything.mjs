'use strict';

import { assert } from 'jsr:@std/assert';

class Game {
	// players :: Map<id, {score: number, status: (active | departed)}>
	_players = new Map();
	// rounds :: List<Map<player, {definition, List<voter>}>>
	_rounds = new Array();

	playerNew() {
		const player = new Player(this);
		this._players.set(player.id, { score: 0, status: 'active' });
		return player;
	}

	playerLeave(id) {
		const player = this._players.get(id);
		this._players.set(id, { score: player.score, status: 'departed' });
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
		console.log('hi again!');
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

// Deno.test('-TEMPLATE-', () => {
// 	const game = new Game();
// 	const player = game.playerNew();
// });
