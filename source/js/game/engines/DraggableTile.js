/* global Strong, Elastic, Draggable, TweenLite */
var BaseTile = require("./BaseTile");

class DraggableTile extends BaseTile {
	constructor(x,y, id, title, image, width, height) {
		super(x, y, id, title, image, width, height);
		this._draggable = Draggable.create(this._$element, {
			type: "top,left",
			onPress: () => this.onPress(),
			onRelease: () => this.onRelease(),
			onDrag: () => this.onDrag(),
			onDragStart: () => this.onDragStart(),
			onDragEnd: () => this.onDragEnd(),
			zIndexBoost : true
		});
	}
	disable() {
		this._draggable[0].disable();
	}
	enable() {
		this._draggable[0].enable();
	}
	/* Tile Events */
	onRelease() {
		DraggableTile.isDragging = false;
		TweenLite.to(this._$element, .2, {
			scale: 1,
			ease: Strong.easeOut
		});
		$.publish("/game/step", this);
	}
	onDragStart() {
		$.publish("/tile/drag/start", this);
	}
	onPress(e) {
		if (DraggableTile.singleDrag) {
			if (DraggableTile.isDragging) {
				//since singleDrag mode is enabled, it will only allow to drag on tile at the same time, so the draggins is cancelled
				this._draggable[0].endDrag(e);
			} else {
				DraggableTile.isDragging = true;
				$.publish("/tile/press", this);
				TweenLite.to(this._$element, 0.3, {
					scale: 0.92,
					ease: Elastic.easeOut
				});
			}
		} else {
			$.publish("/tile/press", this);
			TweenLite.to(this._$element, 0.3, {
				scale: 0.92,
				ease: Elastic.easeOut
			});
		}
	}
	onDragEnd() {
		$.publish("/tile/drag/end", this);
	}
	onDrag() {
		$.publish("/tile/drag", this);
	}
}

module.exports = DraggableTile;
