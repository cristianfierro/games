var BaseTile = require("./BaseTile");

class ClickableTile extends BaseTile {
	constructor(x,y, id, title, image, width, height) {
		super(x, y, id, title, image, width, height);
		this._$element.click(() => this.onClick());
		//Note: Both of these methods work, I will leave this one commented for reference.
		//this._$element.click(this.onClick.bind(this));
	}
	onClick() {
		$.publish("/tile/click", this);
	}
	index(maxColumns) {
		return (this._y * maxColumns) + this._x;
	}
	resize(width, height) {
		super.resize(width, height);
		this._$element.off(); //should not have any events attached, but just in case...
		this._$element.click(() => this.onClick());

	}
}

module.exports = ClickableTile;
