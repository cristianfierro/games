var _ = require("lodash");
var EngineContext = require("../EngineContext");
/* States */
var End = require("./states/end");
var Instructions = require("./states/instructions");
var Playing = require("./states/playing");
require('../../../../sass/buckets.scss');

class BucketsEngine extends EngineContext {
	/**
	 * constructor - This is the Buckets Game. In this game the user is presented with a pile of images and the user
	 * 				 has to drag the image (or click on the answers at the bottom) to the side that the user considers
	 * 				 answers the challenge.
	 *
	 * @param  {jQueryObject} container This is the jQuery wrapped object that will be used to draw the game.
	 * @param  {AssetsLoader} loader    This is a reference to the AssetsLoader that PuzzleGame's uses to load the resources.
	 * @param  {object}       config    This is the transformed json configuration file which has settings for the game
	 */
	constructor(container, loader, config) {
		super(container, loader, config.id, config.gametype);
		this._settings = {};
		_.assign(this._settings, config.settings);

		this.registerState("instructions", new Instructions(this, this._settings));
		this.registerState("playing", new Playing(this, this._settings));
		this.registerState("end", new End(this, this._settings, config.id));
	}
	/**
	 * start - This method renders the initial state of the game and will automatically be called by PuzzleGame.
	 *
	 * @param  {function} callback PuzzleGame will wait for this callback to be called before lifting the loading screen and showing the Game.
	 */
	start(callback) {
		if (this._settings.custom.showSplashscreen) {
			this.changeState("instructions");
		} else {
			this.changeState("playing");
		}
		//only call callback if it has been defined
		callback && callback();
	}

}

module.exports = BucketsEngine;
