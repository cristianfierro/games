var State = require("../../State");
var _ = require("lodash");
var Tools = require("../../../Tools");

class Playing extends State {
	constructor(context, slides, settings) {
		super(context);
		this._settings = settings;
		this._slides = this._settings.randomizeOrder === "yes" ? _.shuffle(slides) : slides;
		this._currentIndex = 0;
		this._current = this._slides[this._currentIndex];

		this._$template = $(`
			<div class="inactive">
				<div id="header">
					<span class="progress">1 of 8</span>
					<span class="score">Score: 0/100</span>
				</div>
				<div class="slide slide-${this._current.id}" id="slide-${this._current.id}">
					<canvas id="canvas-slide-${this._current.id}"></canvas>
					<div class="timer">
						<span class="timer-bg"></span>
						<span class="timer-fg"></span>
					</div>
					<div class="answers">
					</div>
					<div class="feedbacktext"></div>
				</div>
			</div>
		`);
		// Keep a cache of the canvas context
		this._canvasContext = $("canvas", this._$template).get(0).getContext('2d');

		// Keep a cache of several html elements too
		this._$answers = $(".answers", this._$template);
		this._$timerFg = $(".timer-fg", this._$template);
		this._$feedback = $(".feedbacktext", this._$template);
		this._$progress = $(".progress", this._$template);
		this._$score = $(".score", this._$template);

		this._stepInterval = null;

		// Punctuation variables
		this._pointsPerSlide = _.ceil(this._settings.totalPoints / this._slides.length);
		this._earnedPoints = 0;
	}

	/**
	 * This method is the first called by EngineContext after the State has been instantiated and has been requested by either the EngineContext or another State
	 */
	go() {
		this.context.analytics.record("Game Started");
		this._canAnswer = true;
		//Update the scores and the current slide
		this._$progress.html(`${this._currentIndex + 1} / ${this._slides.length}`);
		this._$score.html(`Score: ${this._earnedPoints} / ${this._settings.totalPoints}`);
		//applying some resets
		this._$feedback.empty();
		this._$feedback.hide();

		if (this._stepInterval) {
			clearInterval(this._stepInterval);
		}
		// Let's add the answers of the current slide, but we first remove the existing answers
		this._$answers.empty(); //this will effectively clear the event listeners attached to the child elements too
		_.forEach(this._current.answers, (answer) => {
			this._$answers.append(`
				<a href="#" class="answer">${answer.caption}</a>
			`);
		});

		//This won't add multiple listeners whenever go() is called because this._$answers.empty() took care of removing them already
		$("a", this._$answers).on("click", (e) => {
			e.preventDefault();
			if (this._canAnswer) {
				this._canAnswer = false;
				clearInterval(this._stepInterval);
				this.paint(this._settings.finalQuality);
				let item = $(e.target);

				let answer = _.find(this._current.answers, { caption: item.text() });

				if (answer && answer.correct) {
					item.addClass('winner');
					this.showFeedback("winner");
					this._earnedPoints += _.ceil(this._potentialPoints);
					this.context.analytics.record("Answered Question", { slideId: this._current.id, answer: answer.caption, correct: "correct", score: _.ceil(this._potentialPoints) });

					//Visually update the scores
					this._$score.html(`Score: ${this._earnedPoints} / ${this._settings.totalPoints}`);
				} else {
					item.addClass('loser');
					this.showFeedback("loser");
					/* Penalizations for bad answers has been disabled */
					//this._earnedPoints -= this._pointsPerSlide;
					this.context.analytics.record("Answered Question", { slideId: this._current.id, answer: answer.caption, correct: "incorrect", score: 0 });

					//Visually update the scores
					this._$score.html(`Score: ${this._earnedPoints} / ${this._settings.totalPoints}`);
				}
			}
		});
		let width = this._$template.width();
		let resizeFactor = width / this._current.image.width;
		this._canvasContext.canvas.width = width;
		this._canvasContext.canvas.height = this._current.image.height * resizeFactor;
		this.paint(0.01);
		this._$template.css({ "visibility": "visible"}).hide().fadeIn();
		this.startCountdown();
	}

	/**
	 * This method will be called after an answer has been... answered. This will transition to the next
	 *  image or change the the end state if all the images have been iterated.
	*/
	next() {
		setTimeout(() => {
			if (this._currentIndex < this._slides.length - 1) {
				this._currentIndex++;
				this._current = this._slides[this._currentIndex];
				this._$template.fadeOut(400, ()=>{
					this._$template.css({"visibility": "hidden"});
					this.go();
				});

			} else {
				this._currentIndex = 0;
				this._current = this._slides[this._currentIndex];
				let points = this._earnedPoints;
				this._earnedPoints = 0;

				/*
				 * Please note that the next state is called here with any number of parameters...
				 *  all these parameters will be passed to the go() method of the 'end' state.
				*/
				this._$template.fadeOut(400, ()=>{
					this._$template.css({"visibility": "hidden"});
					this.nextState("end", points, this._settings.totalPoints, this._slides.length);
				});
			}
		}, this._settings.nextSlideDuration);
	}

	/* This starts the timer animation on the header of the game screen and every tick of the interval will call paint() to redraw the image in the canvas */
	startCountdown() {
		let stepsElapsed = 0;
		let percentComplete = 0;
		this._stepInterval = setInterval(()=> {
			let totalSteps = this._settings.slideDuration * this._settings.stepsPerSecond;
			let timeElapsed = stepsElapsed / this._settings.stepsPerSecond * 1000;
			let percentPerStep = 1 / totalSteps;
			if (stepsElapsed < totalSteps) {
				let quality = Tools.easeInSine(percentComplete, timeElapsed, this._settings.initialQuality, this._settings.finalQuality, this._settings.slideDuration * 1000);

				this.paint(quality);

				let inversePercent = 100 - percentComplete * 100;
				this._$timerFg.width(inversePercent + "%");

				let inversePotentialPoints = Tools.easeInSine(percentComplete, timeElapsed, 0, this._pointsPerSlide, this._settings.slideDuration * 1000);
				this._potentialPoints = this._pointsPerSlide - inversePotentialPoints;
				stepsElapsed++;
				percentComplete = percentComplete + percentPerStep;
			} else {
				clearInterval(this._stepInterval);
				this.next();
			}
		}, 1000/this._settings.stepsPerSecond);
	}

	showFeedback(status) {
		if (status === "winner") {
			this._$feedback.append(`
				<div class="correct-holder">
					<span class="correct">Correct!</span>
					<span class="points">+${_.ceil(this._potentialPoints)} Points</span>
				</div>
			`);
		} else {
			this._$feedback.append(`
				<div class="incorrect-holder">
					<span class="incorrect">Incorrect!</span>
				</div>
			`);
		}
		this._$feedback.show();
		//adjust the size of the feedback
		this._$feedback.height(this._canvasContext.canvas.height);
		Tools.fitText(".feedbacktext .correct, .feedbacktext .incorrect", .7);
		Tools.fitText(".feedbacktext .points");

		setTimeout(()=>{
			this._$feedback.fadeOut(1000, () => {
				this.next();
			});
		}, this._settings.successFadeOutDelay);
	}

	/* This will draw the image in the canvas with a given quality value. The lower the quality the more pixelated the image will be */
	paint(quality) {
		this._canvasContext.mozImageSmoothingEnabled = false;
		this._canvasContext.imageSmoothingEnabled = false;
		this._canvasContext.webkitImageSmoothingEnabled = false;
		this._canvasContext.imageSmoothingEnabled = false;

		//works better than Math.floor but doesn't work on negatives
		//credit: http://stackoverflow.com/questions/7487977/using-bitwise-or-0-to-floor-a-number
		let tinyW = this._canvasContext.canvas.width * quality | 0;
		let tinyH = this._canvasContext.canvas.height * quality | 0;

		//keep it from going beyond the container width, which causes problems in firefox
		//credit: http://stackoverflow.com/questions/22985452/firefox-drawimage-tot-canvas-error-indexsizeerror-index-or-size-is-negative-or
		if (tinyW > this._canvasContext.canvas.width - 1) {
			tinyW = this._canvasContext.canvas.width;
		}
		if (tinyH > this._canvasContext.canvas.height - 1) {
			tinyH = this._canvasContext.canvas.height;
		}
		this._canvasContext.drawImage(this._current.image, 0, 0, tinyW, tinyH);
		this._canvasContext.drawImage(this._canvasContext.canvas, 0, 0, tinyW, tinyH, 0, 0, this._canvasContext.canvas.width, this._canvasContext.canvas.height);
	}

}

module.exports = Playing;
