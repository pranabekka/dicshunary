'use strict';

export class Game {
	// playersActive :: { [id]: name }
	playersActive = {};
	playersDisconnected = {};
	// scoresByRound :: [ { [id]: score } ]
	scoresByRound = [];

	playerAdd(name, id) {
		id = 'player-' + crypto.randomUUID();
		name = this.newNameParse(name);
		this.playersActive[id] = { name, score: 0 };
		return { type: 'join-ack', name, id };
	}

	playerRemove(id) {
		const info = this.playersActive[id];
		delete this.playersActive[id];
		this.playersDisconnected[id] = info;
	}

	// creates valid name
	// by fixing collisions with pre-existing names
	newNameParse(newName) {
		// collisionState :: 'maybe' | 'yes' | 'no'
		let collisionState = 'maybe';

		while (collisionState === 'maybe') {
			// detect collisions with active players
			for (const player in this.playersActive) {
				const name = this.playersActive[player].name;
				if (newName === name) {
					collisionState = 'true';
					break;
				}
			}
			// detect collisions with disconnected players
			for (const player in this.playersDisconnected) {
				const name = this.playersDisconnected[player].name;
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
