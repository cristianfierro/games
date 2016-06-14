var _ = require("lodash");
var EngineContext = require("../EngineContext");
/* States */
var Instructions = require("./states/instructions");
var Playing = require("./states/playing");
var EndGame = require("./states/end");
require('../../../../sass/photos.scss');

class PixelationEngine extends EngineContext {
	/**
	 * constructor - This is the Pixelation Game, as the name of the class wisely implies.
	 *
	 * @param  {jQueryObject} container This is the jQuery wrapped object that will be used to draw the game.
	 * @param  {AssetsLoader} loader This is a reference to the AssetsLoader that PuzzleGame's uses to load the resources.
	 * @param  {object}     config  This is the transformed json configuration file which has settings for the game
	 */
	constructor(container, loader, config) {
		super(container, loader, config.id, config.gametype);
		/**
		 * These are the properties that can be overrided with the json file
		 */
		this._settings = {
			stepsPerSecond: 5,
			nextSlideDuration: 400,
			successFadeOutDelay: 800,
			slideDuration: 20,
			randomizeOrder: true,
			headline: "",
			initialQuality: 0.01,
			finalQuality: 1,
			totalPoints: 100
		};
		/* Override the default settings values */
		/* I'm sorry for the following ugly mess, but lodash assign wasnt properly assigning the properties here so i had to do it manually */
		//this._settings = _.assign(settings.custom, defaultSettings);
		this._settings.slides = config.settings.custom.slides;
		this._settings.win = config.settings.custom.win;
		this._settings.resources = config.settings.resources;
		if (config.settings.custom.stepsPerSecond) {
			this._settings.stepsPerSecond = config.settings.custom.stepsPerSecond;
		}
		if (config.settings.custom.nextSlideDuration) {
			this._settings.nextSlideDuration = config.settings.custom.nextSlideDuration;
		}
		if (config.settings.custom.successFadeOutDelay) {
			this._settings.successFadeOutDelay = config.settings.custom.successFadeOutDelay;
		}
		if (config.settings.custom.slideDuration) {
			this._settings.slideDuration = config.settings.custom.slideDuration;
		}
		if (config.settings.custom.randomizeOrder) {
			this._settings.randomizeOrder = config.settings.custom.randomizeOrder;
		}
		if (config.settings.custom.headline) {
			this._settings.headline = config.settings.custom.headline;
		}
		if (config.settings.custom.initialQuality) {
			this._settings.initialQuality = config.settings.custom.initialQuality;
		}
		if (config.settings.custom.finalQuality) {
			this._settings.finalQuality = config.settings.custom.finalQuality;
		}
		if (config.settings.custom.totalPoints) {
			this._settings.totalPoints = config.settings.custom.totalPoints;
		}

		let slides = [];
		_.forEach(this._settings.slides, (id) => {
			let resource = this.loader.getAsset(id);
			slides.push(resource);
		});

		/* Registering Game States */
		this.registerState("instructions", new Instructions(this, this._settings.slides.length || 0, this._settings.slideDuration || 0));
		this.registerState("playing", new Playing(this, slides, this._settings));
		this.registerState("end", new EndGame(this, config.id));


	}


	/**
	 * start - This method renders the initial state of the game and will automatically be called by PuzzleGame.
	 *
	 * @param  {function} callback PuzzleGame will wait for this callback to be called before lifting the loading screen and showing the Game.
	 */
	start(callback) {
		this.changeState("instructions");
		callback();
	}

}
module.exports = PixelationEngine;
