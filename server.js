'use strict';

export class Game {
	players = {};

	join(name, id) {
		id = 'player-' + crypto.randomUUID();
		name = this.newNameParse(name);
		this.players[id] = name;
		return { type: 'join-ack', name, id };
	}

	// creates valid name
	// by fixing collisions with pre-existing names
	newNameParse(newName) {
		// collisionState :: 'maybe' | 'yes' | 'no'
		let collisionState = 'maybe';

		while (collisionState === 'maybe') {
			// detect collisions
			for (const player in this.players) {
				const name = this.players[player];
				if (newName === name) {
					collisionState = 'true';
					break;
				}
			}

			// fix detected collision in this loop
			if (collisionState !== 'true') {
				collisionState = 'false';
			} else {
				const suffixPartOpts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
				const suffixP1 = suffixPartOpts[Math.floor(Math.random() * suffixPartOpts.length)];
				const suffixP2 = suffixPartOpts[Math.floor(Math.random() * suffixPartOpts.length)];
				newName = newName + ' (' + suffixP1 + suffixP2 + ')';
				collisionState = 'maybe';
			}
		}

		return newName;
	}
}
