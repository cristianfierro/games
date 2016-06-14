var State = require("../../State");
var AggregateScore = require("../../../AggregateScore");

/* The final state of the game, it shows the score and asks the user if he wants to play another round */
class EndGame extends State {
	constructor(context, settings, id) {
		super(context);
		this._settings = settings;
		this._aggregate = new AggregateScore(id);
		this._$template = $(`
			<div class="intro">
			<div class="score-recap">
				<span class="header">Final Score:</span>
				<span class="large score">0 / 0</span>
				<span class="header">Average Score:</span>
				<span class="large average">0</span>
				<span class="header">
					<a href="" class="button">Try Again</a>
				</span>
			</div>
			<br>
			<br>
			</div>
		`);


	}
	/**
	 * This is a good example of a state that receives multiple parameters. In the playing state after the images
	 *  were all displayed, the playing state finished and passed as parameters to nextState() the points earned
	 *  by the player. This way EndGame state doesnt need to know how the game was played since it only needs to
	 *  know how much points the user made.
	 */
	go(matches, total) {
		let matches_over_100 = Math.round(matches * 100 / total);
		this.context.analytics.record("Game Completed", { final_score: matches_over_100, max_final_score: 100 });
		this.context.analytics.submit();
		let average = this._aggregate.getAverageScore();
		
		$(".large.score", this._$template).html(`${matches_over_100} / 100`);
		$(".large.average", this._$template).html(`${average}`);
		$(".score-recap").fadeIn();
		$(".answer", this._$template).on("click", (e) => {
			e.preventDefault();
			if (this._settings.custom.showSplashscreen) {
				this._context.changeState("instructions");
			} else {
				this._context.changeState("playing");
			}
		});
	}
}

module.exports = EndGame;
