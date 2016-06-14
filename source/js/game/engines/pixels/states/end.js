var State = require("../../State");
var AggregateScore = require("../../../AggregateScore");

/* The final state of the game, it shows the score and asks the user if he wants to play another round */
class EndGame extends State {
	constructor(context, id) {
		super(context);
		this._aggregate = new AggregateScore(id);
		this._$template = $(`
			<div id="header">
				<span class="progress">1 of 8</span>
				<span class="score">Score: 0/100</span>
			</div>
			<div class="score-recap">
				<span class="header">Final Score:</span>
				<span class="large final_score">0 / 0</span>
				<span class="header">Average Score:</span>
				<span class="large average">0</span>
				<span class="header">
					<a href="" class="answer">Try Again</a>
				</span>
			</div>
			<br>
			<br>
		`);


	}
	/**
	 * This is a good example of a state that receives multiple parameters. In the playing state after the images
	 *  were all displayed, the playing state finished and passed as parameters to nextState() the points earned
	 *  by the player. This way EndGame state doesnt need to know how the game was played since it only needs to
	 *  know how much points the user made.
	 */
	go(points, total, questions) {
		this.context.analytics.record("Game Completed", { final_score: points, max_final_score: total });
		this.context.analytics.submit();
		let average = this._aggregate.getAverageScore();

		$(".large.final_score", this._$template).html(`${points} / ${total}`);
		$(".large.average", this._$template).html(`${average}`);
		$(".score", this._$template).html(`Score: ${points} / ${total}`);
		$(".progress", this._$template).html(`${questions} of ${questions}`);
		$(".score-recap").fadeIn();
		$(".answer", this._$template).on("click", (e) => {
			e.preventDefault();
			this._context.changeState("instructions");
		});
	}
}

module.exports = EndGame;
