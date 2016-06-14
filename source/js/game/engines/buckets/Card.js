/* global Draggable */
class Card {

	/**
	 * constructor - Visual Representation of each card of the Game
	 *
	 * @param  {type} id           The id that identifies the image
	 * @param  {type} image        The url of the image
	 * @param  {type} rotation = 0 The rotation of the card (to simulate a stack of cards)
	 * @param  {type} callback     The callback to send the drag events
	 * @param  {type} answer       The correct answer for this card
	 */
	constructor(id, image, rotation = 0, callback, answer) {


		this._id = id;
		this._answer = answer;
		this._callback = callback;
		this._image = image;
		this._$element = $(`
			<div>
				<div class="card" style="transform: rotate(${rotation}deg)">
					<image src="${this._image}" alt="" />
				</div>
			</div>
		`);
		this._draggable = Draggable.create(this._$element, {
			type: "x",
			onDragEnd: this.onDragEnd.bind(this),
			zIndexBoost: true
		});
	}
	get Answer() {
		return this._answer;
	}
	get Id() {
		return this._id;
	}

	onDragEnd() {
		this._callback(this, this._draggable[0].getDirection('start'));
		//TweenLite.set(this._$element, {clearProps:"all"});
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
	template() {
		return this._$element;
	}
}

module.exports = Card;
