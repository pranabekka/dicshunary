'use strict';

import { assert } from 'jsr:@std/assert';

class Game {
	// players :: Map<id, [score, status]>
	players = new Map();
	// rounds :: List<Map<player, [definition, List<voter>]>>
	rounds = new Array();

	playerJoin() {
		const player = new Player();
		this.players.set(player.id, [0, 'active']);
		return new Player();
	}
}

class Player {
	constructor() {
		this.id = 'player-' + crypto.randomUUID();
	}
	leave() {
		console.log('bye-bye!');
	}
	rejoin() {
		console.log('hi again!');
	}
}

Deno.test('(EXAMPLE) create player', () => {
	const player = new Game().playerJoin();
	assert(
		player instanceof Player,
		'should get a Player instance'
	);
});
