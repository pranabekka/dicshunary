'use strict';

export class Game {
	// playersActive :: { [id]: name }
	playersActive = {};
	playersDisconnected = {};
	// scoresByRound :: [ { [id]: score } ]
	scoresByRound = [];
	stages = ['lobby', 'giving', 'guessing', 'reading', 'voting', 'scoring'];
	currentStage = this.stages[0];
	// must have at least 1 giver and 2 guessers
	_minPlayerCount = 3;

	playerAdd(name, id) {
		if (this.playersDisconnected[id] !== undefined) {
			name = this.newNameParse(name);
			const { score } = this.playersDisconnected[id];
			delete this.playersDisconnected[id];
			this.playersActive[id] = { name, score };
			return { name, id };
		} else {
			id = 'player-' + crypto.randomUUID();
			name = this.newNameParse(name);
			this.playersActive[id] = { name, score: 0 };
			return { name, id };
		}
	}

	playerRemove(id) {
		const info = this.playersActive[id];
		delete this.playersActive[id];
		this.playersDisconnected[id] = info;
	}

	nextStage() {
		const activeCount = Object.keys(this.playersActive).length;
		if (activeCount >= this._minPlayerCount) {
			const currentIdx = this.stages.indexOf(this.currentStage);
			const nextIdx = currentIdx === this.stages.length - 1 ?
				0 : currentIdx + 1;
			this.currentStage = this.stages[nextIdx];
		}
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
