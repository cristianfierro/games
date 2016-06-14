/* global TweenLite, Sine */
var State = require("../../State");
var _ = require("lodash");
var Card = require("../Card");

class Playing extends State {
	constructor(context, settings) {
		super(context);
		this._settings = settings;

		this._$template = $(`
			<div class="board">
				<div class="header">
					<div>
					<span class="timer">00:58</span>
					<span class="status">0 out of ${this._settings.custom.slides.length} Correct</span>
					</div>
					<div class="progress">
						<span class="progress-fg"></span>
					</div>
				</div>
				<div class="content">
					<div class="west">
						<div class="answer">
							<span>A</span>
						</div>
					</div>
					<div class="east">
						<div class="answer">
							<span>B</span>
						</div>
					</div>
					<div class="pile">
					</div>
				</div>
				<div class="footer">
					<div class="challenge">
						<h1>${this._settings.custom.challenge}</h1>
					</div>
					<div class="options">
						<a class="option option-a noselect">
							Answer A
						</a>
						<a class="option option-b noselect">
							Answer B
						</a>
					</div>
				</div>
			</div>
		`);
		this._$west = $(".west", this._$template);
		this._$east = $(".east", this._$template);
		this._$pile = $(".pile", this._$template);
		this._$progress = $(".progress-fg", this._$template);
		this._$timer = $(".timer", this._$template);
		this._$status = $(".status", this._$template);
		this._$optionA = $(".option-a", this._$template);
		this._$optionB = $(".option-b", this._$template);

		this._$optionA.text(`${this._settings.custom.answers["a"].title}. ${this._settings.custom.answers["a"].description}`);
		this._$optionB.text(`${this._settings.custom.answers["b"].title}. ${this._settings.custom.answers["b"].description}`);

		this._$optionA.on("click", { direction: "left" }, this.onClick.bind(this));
		this._$optionB.on("click", { direction: "right" }, this.onClick.bind(this));

		this.pepe = 0;

	}

	/**
	 * This method is the first called by EngineContext after the State has been instantiated and has been requested by either the EngineContext or another State
	 */
	go() {
		this._corrects = 0;
		this._cards = [];
		this._$pile.empty();
		_.forEach(this._settings.custom.slides, (slide) => {
			let item = this.context.loader.getAsset(slide);
			let rotation = Math.random() * 6 - 3;
			let card = new Card(item.id, item.url, rotation, this.onDragEnd.bind(this), item.answer);
			this._cards.push(card);
			this._$pile.append(card.template());
		});
		this._totalCards = this._cards.length;
		this._totalTime = this._cards.length * this._settings.custom.slideduration;
		this.updateTimer(this._totalTime);
		this.startCountdown();
		this.emit("buckets:start", this);
	}


	/**
	 * onClick - Handles the click on the buttons bellow the pile of cards, each button has a direction attribute which will
	 * 			 be sent to the onDragEnd event handler.
	 *
	 * @param  {Event} event The click event that triggered this method
	 */
	onClick(event) {
		if (this._cards.length > 0) {
			this.onDragEnd(this._cards[this._cards.length - 1], event.data.direction);

		}
	}


	/**
	 * onDragEnd - Handles the drag event sent by each image. It detects the general direction of the drag
	 * 			   and evaluates the answers accordingly.
	 *
	 * @param  {Card}   item      The image/card that is being dragged.
	 * @param  {String} direction The general direction of the drag: left, right, up, down, etc.
	 */
	onDragEnd(item, direction) {
		let xdistance = this._$pile.offset().left + (item.template().width() / 2) - 50;
		let ydistance = 177;
		if (direction === "left") {

			this._cards.pop();
			this.throwCard(item, -xdistance, ydistance, "a");

		} else if (direction === "right") {

			this._cards.pop();
			this.throwCard(item, xdistance, ydistance, "b");

		} else {

			TweenLite.to(item.template(), 0.2, {
				autoAlpha : 1,
				scale     : 1,
				x         : 0,
				y         : 0
			});

		}
	}


	/**
	 * throwCard - DRY, does the drop animation.
	 *
	 * @param  {Card}   item      The item being dragged
	 * @param  {Float}  xdistance The distance in pixels on the X axis to the desired destination
	 * @param  {Float}  ydistance The distance in pixels on the Y axis to the desired destination
	 * @param  {String} answer    The direction on which the card is Thrown
	 */
	throwCard(item, xdistance, ydistance, answer) {
		this.emit("buckets:throw-card", this);
		this.pepe = 22;
		TweenLite.to(item.template(), 0.2, {
			autoAlpha : 1,
			scale     : 0,
			x      : xdistance,
			y       : ydistance,
			onComplete: () => {
				this.pepe = 2;
				if (item.Answer === answer) {
					this._corrects++;
					this._$status.text(`${this._corrects} out of ${this._totalCards} Correct`);
					if (xdistance > 0) {
						$(".answer", this._$east).append(`<div class="feedback"></div>`);
					} else {
						$(".answer", this._$west).append(`<div class="feedback"></div>`);
					}
				} else {
					if (xdistance > 0) {
						$(".answer", this._$east).append(`<div class="feedback incorrect"></div>`);
					} else {
						$(".answer", this._$west).append(`<div class="feedback incorrect"></div>`);
					}
				}
				console.log("CARD THROWN");
				this.emit("buckets:feedback-shown", this);
				TweenLite.to($(".feedback"), 1, {
					y:-100,
					opacity:0,
					ease: Sine.easeOut
				});
				if (this._cards.length <= 0) {
					this.nextState("end", this._corrects, this._totalCards);
				}

			}
		});
	}


	/**
	 * padZero - Pads a number to have `size` - `value`.length significant zeroes to the left.
	 *
	 * @param  {Float}  value Value to be Padded, ex: 192
	 * @param  {Float}  size  Length of the resulting number, ex: 5
	 * @return {String}       The Padded number, ex: "00192"
	 */
	padZero(value, size) {
		value = "0000000000" + value;
		return value.substr(value.length - size);
	}


	/**
	 * updateTimer - Updates the timer on the top of the game UI
	 *
	 * @param  {type} seconds Seconds since the game started
	 */
	updateTimer(seconds) {
		let mod = seconds % 60;
		let minutes = (seconds - mod) / 60;

		this._$timer.text(`${this.padZero(minutes, 2)}:${this.padZero(mod, 2)}`);
	}

	/* This starts the timer animation on the header of the game screen and every tick of the interval will call paint() to redraw the image in the canvas */
	startCountdown() {

		let seconds = this._totalTime;
		let elapsedTime = 0;
		this._stepInterval = setInterval(()=> {
			elapsedTime++;
			let percent = (elapsedTime * 100) / this._totalTime;
			this._$progress.width((100 - percent) + "%");
			if (percent >= 100) {
				clearInterval(this._stepInterval);
				this.nextState("end", this._corrects, this._totalCards);
			}
			seconds--;
			this.updateTimer(seconds);
		}, 1000);
	}
}

module.exports = Playing;
