var State = require("../../State");

/* Simple enough, this state will only show the Instructions for the Pixelation Game */
class Instructions extends State {
	constructor(context, numberOfQuestions, timePerQuestion) {
		super(context);
		this._numberOfQuestions = numberOfQuestions;
		this._questionWord = numberOfQuestions > 1 ? "questions" : "question";
		this._timePerQuestion = timePerQuestion;
		this._$template = $(`
			<div class="intro inactive">
				<p>This puzzle has <span class="numberOfQuestions">${this._numberOfQuestions}</span> <span class="questionWord">${this._questionWord}</span> and should take you around <span class="timePerQuestion">${this._timePerQuestion}</span> seconds to complete.</p>
				<a href="" class="answer start">Let's Go!</a>
				<p>
					<strong>How it works</strong>
					The faster you answer the more points you get. Wrong guesses will earn you no points!
				</p>
				<br>
				<br>
			</div>
		`);

	}
	/**
	 * This method will be called by EngineContext so signal that the State is now shown and that it can proceed to do stuff
	*/
	go() {
		this.context.analytics.record("Game Loaded");
		this._$template.css({ "visibility": "visible"}).hide().fadeIn();
		this._$start = $(".start", this._$template);

		this._$start.on('click', (e) => {
			e.preventDefault();
			this._$template.fadeOut(() => {
				this.nextState("playing");
			});
		});
	}
}

module.exports = Instructions;
