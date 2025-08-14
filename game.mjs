'use strict';

export class Game {
	// type Player = String<'player-', UUID>
	// type _players = Map<
	// 	Player,
	// 	Struct<
	// 		score: Number,
	// 	>
	// >
	_players = {};
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

	playerJoin() {
		const player = 'player-' + crypto.randomUUID();
		this._players[player] = { score: 0 };
		this._updateGiver(player);
	}

	// only giver will issue this command
	// only when there are enough players
	wordGive(word) {
		const progress = this._nextStage();
		this._currentRoundGet().word = word;
		this._currentRoundGet().definitions = {};
	}

	definitionGive(player, definition) {
		const definitions = this._currentRoundGet().definitions;
		definitions[player] = definition;

		const definitionCount = Object.keys(definitions).length;
		const playerCount = Object.keys(this._players).length;
		if (definitionCount === playerCount) {
			this._nextStage();
		}
	}

	_updateGiver(player) {
		if (this._currentRoundGet().giver === null) {
			this._currentRoundGet().giver = player;
		}
	}

	_nextStage() {
		const currentRound = this._currentRoundGet();
		switch (currentRound.stage) {
			case this._stages.giving:
				currentRound.stage = this._stages.defining;
				break;
			case this._stages.defining:
				currentRound.stage = this._stages.voting;
				break;
			case this._stages.voting:
				currentRound.stage = this._stages.scoring;
				break;
			case this._stages.scoring:
				currentRound.stage = this._stages.giving;
				break;
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
