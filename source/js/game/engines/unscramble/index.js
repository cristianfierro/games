var _ = require("lodash");
var EngineContext = require("../EngineContext");
/* States */
var Playing = require("./states/playing");
require('../../../../sass/tilegames.scss');

class UnscrambleEngine extends EngineContext {
	/**
	 * constructor - This is the Unscramble Game. It will show a single image that has been sliced a predetermined number of times
	 *  and will shuffle them. The player has to drag the images and get the original unsliced image to win.
	 *
	 * @param  {jQueryObject} container This is the jQuery wrapped object that will be used to draw the game.
	 * @param  {AssetsLoader} loader This is a reference to the AssetsLoader that PuzzleGame's uses to load the resources.
	 * @param  {object}     config  This is the transformed json configuration file which has settings for the game
	 */
	constructor(container, loader, config) {
		super(container, loader, config.id, config.gametype);

		this._settings = {
			custom: {
				tileWidth: 300,
				tileHeight: 300,
				maxColumns: 3,
				maxRows: 2
			}
		};
		_.assign(this._settings, config.settings);

		this._draggedTile = null;
		this._draggedTileIndex = null;

		this._isMovingTiles = false;
		this._dropTarget = null;
		/* Calculate grid dimensions */

		this.calculateDimensions();

		/* registering states */
		this.registerState("playing", new Playing(this, this._settings.custom, this._settings.host));
	}
	start(callback) {
		this.changeState("playing");
		callback();

	}
	resize(callback) {
		this.states["playing"].resize();
		if (callback) callback();
	}
	calculateDimensions() {
		if (this._settings.custom.complexity == "hard") {
			this._settings.custom.maxColumns = 5;
			this._settings.custom.maxRows = 3;
		}
		else {
			this._settings.custom.maxColumns = 3;
			this._settings.custom.maxRows = 2;
		}
	}
}

module.exports = UnscrambleEngine;
