'use strict';

export class Game {
	// type Player = String<'player-', UUID>
	// type _players = Map<
	// 	Player,
	// 	Struct<
	// 		score: Number,
	// 	>
	// >
	_players = new Map();
	_stages = {
		giving: 'giving-a204b75',
		defining: 'defining-ed84077',
		voting: 'voting-227a041',
		scoring: 'scoring-5bcacd0',
	};
	// type Giver = Player
	// type Stage = OneOf<_stages.giving, _stages.defining, _stages.voting, _stages.scoring>
	// type _rounds = List<
	// 	Struct<
	// 		giver: Giver,
	// 		stage: Stage,
	// 		word: String,
	// 		definitions: Map<Player, String>
	// 	>
	// >
	_rounds = [];

	constructor() {
		this._roundNew();
	}

	// also adds player as new joinee
	playerNew() {
		const player = 'player-' + crypto.randomUUID();
		this._players.set(player, { score: 0 });
		this._updateGiver(player);
		return player;
	}

	givingToGuessing(player, word) {
		const progress = this._nextStage(player);
		if (progress === true) {
			const currentRound = this._currentRoundGet();
			currentRound.word = word;
		}
	}

	definitionSubmit(player, definition) {
		const currentRound = this._currentRoundGet();
		if (currentRound.definitions === undefined) {
			currentRound.definitions = {};
		}
		currentRound.definitions[player] = definition;
	}

	_updateGiver(player) {
		if (this._currentRoundGet().giver === null) {
			this._currentRoundGet().giver = player;
		}
	}

	_nextStage(player) {
		const currentRound = this._currentRoundGet();
		if (player !== currentRound.giver || this._players.size < 3) {
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
