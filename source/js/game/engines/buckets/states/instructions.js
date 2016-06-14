var State = require("../../State");

/* Simple enough, this state will only show the Instructions for the Pixelation Game */
class Instructions extends State {
	constructor(context, settings) {
		super(context);
		this._settings = settings;
		this._numberOfQuestions = 0;
		this._$template = $(`
			<div class="intro inactive">
				<p>${this._settings.custom.challenge}</p>
				<br/>
				<br/>
				<a href="" class="button start">Let's Go!</a>
				<br>
				<br>
				<br>
				<br>
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
