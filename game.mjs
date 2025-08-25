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
	// 		definitions: List<
	// 			Struct<author: Player, body: String>
	// 		>,
	// 	>
	// >
	_rounds = [];

	constructor() {
		this._roundNew();
	}

	playerJoin() {
		const player = 'player-' + crypto.randomUUID();
		this._players[player] = { score: 0 };
		this._currentRoundGet().players[player] = { score: 0 };
		this._updateGiver(player);
	}

	// only giver will issue this command
	// only when there are enough players
	wordGive(word) {
		this._currentRoundGet().word = word;
		this._currentRoundGet().stage = this._stages.defining;
		this._currentRoundGet().definitions = [];
	}

	definitionGive(player, definition) {
		const definitions = this._currentRoundGet().definitions;
		definitions.push({author: player, body: definition});

		const definitionCount = definitions.length;
		const playerCount = Object.keys(this._currentRoundGet().players).length;
		if (definitionCount === playerCount) {
			this._currentRoundGet().stage = this._stages.voting;
			this._currentRoundGet().votes = {}
		}
	}

	voteGive(voter, voted) {
		this._currentRoundGet().votes[voter] = voted;

		const voteCount = Object.keys(this._currentRoundGet().votes).length;
		const playerCount = Object.keys(this._currentRoundGet().players).length;
		if (voteCount === playerCount - 1) {
			this._scoresCalculate();
			this._currentRoundGet().stage = this._stages.scoring;
		}
	}

	roundComplete() {
		for (const player in this._currentRoundGet().players) {
			this._players[player].score += this._currentRoundGet().scores[player];
		}

		let nextGiver;
		const players = Object.keys(this._players);
		const giverIdx = players.indexOf(this._currentRoundGet().giver)
		if (giverIdx === players.length - 1) {
			nextGiver = players[0];
		} else {
			nextGiver = players[giverIdx + 1];
		}

		this._roundNew();
		this._currentRoundGet().giver = nextGiver;
		this._currentRoundGet().players = this._players;
	}

	_scoresCalculate() {
		// points the giver gets for each wrong guess
		const giverPoints = 2;
		// points the definers gets when voted for
		const definerPoints = 1;
		// points the guessers get for correct guess
		const guesserPoints = 2;

		const round = this._currentRoundGet();
		round.scores = {};
		for (const player in round.players) {
			round.scores[player] = 0;
		}

		for (const voter in round.votes) {
			const voted = round.votes[voter];
			if (voted === round.giver) {
				round.scores[voter] += guesserPoints;
			} else {
				round.scores[round.giver] += giverPoints;
				round.scores[voted] += definerPoints;
			}
		}
	}

	_updateGiver(player) {
		if (this._currentRoundGet().giver === null) {
			this._currentRoundGet().giver = player;
		}
	}

	_currentRoundGet() {
		return this._rounds[this._rounds.length - 1];
	}

	_roundNew() {
		this._rounds.push(
			{ giver: null, stage: this._stages.giving, players: {} }
		);
	}
}
