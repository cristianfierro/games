/* global Draggable, TweenLite */

class BaseTile {

	/**
	 * constructor - BaseTile class, this will be the building block for all the types of tiles that the tile based games will use
	 *
	 * @param  {Integer} x          The 'X' coordinate at which this tile will be placed
	 * @param  {Integer} y          The 'Y' coordinate at which this tile will be placed
	 * @param  {String} id          The id that represents this tile object
	 * @param  {String} title = ""  The title that the tile will have and that adds meaning to the images that the tile displays.
	 * @param  {String} image       The url of the image that will be displayed inside the tile
	 * @param  {Integer} width      The width in pixels of the tile
	 * @param  {Integer} height     The height in pixels of the tile
	 * @return {BaseTile}           A tile object
	 */
	constructor(x,y, id, title = "", image, width, height) {
		this._id = id;
		this._x = x;
		this._y = y;
		this._title = title;
		this._image = image;
		this._width = width;
		this._height = height;
		this._moving = false;
		this._$element = $(`
			<div class="item" data-id="${this._id}" style="background-image: url('${this._image}');">
				<div class="dd-caption ${this._title === "" ? "inactive" : ""}"><span>${this._title}</span>
				</div>
			</div>
		`);
	}
	get Id() {
		return this._id;
	}

	/**
	 * setStyles - This method is a shortcut to alter the styling of the tile
	 *
	 * @param  {Object} styling An object of key value pairs that will be used by jQuery to update the styles of the tile template. More info: http://api.jquery.com/css/#css-properties
	 */
	setStyles(styling) {
		this._$element.css(styling);
	}


	/**
	 * getStyle - description
	 *
	 * @param  {Object} style   An object of key value pairs that will be used by jQuery to update the styles of the tile template. More info: http://api.jquery.com/css/#css-properties
	 * @return {type}       	Returns the style information that was requested on the style parameter
	 */
	getStyle(style) {
		return this._$element.css(style);
	}
	resize(width, height) {
		this._width = width;
		this._height = height;
	}
	updateCoordinates(x,y) {
		this._x = x;
		this._y = y;
	}
	moveToCanvasCoordinates(x,y, callback) {
		this._x = x;
		this._y = y;
		TweenLite.to(this._$element, 0.2, {
			autoAlpha : 1,
			scale     : 1,
			left      : x * this._width,
			top       : y * this._height,
			onComplete: () => { if (callback) callback.call(); }
		});
	}
	returnToOrigin(callback) {
		TweenLite.to(this._$element, 0.2, {
			autoAlpha : 1,
			scale     : 1,
			left      : this._x * this._width,
			top       : this._y * this._height,
			onComplete: () => { if (callback) callback.call(); }
		});
	}
	template() {

		this._$element.css({
			width: this._width,
			height: this._height,
			left: this._x * this._width,
			top: this._y * this._height
		});

		return this._$element;
	}

	hitTest(tile, threshold = "50%") {
		return Draggable.hitTest(this._draggable[0].target, tile._draggable[0].target, threshold);
	}
}

module.exports = BaseTile;
