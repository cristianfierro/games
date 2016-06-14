var EventEmitter = require('events').EventEmitter;

class State extends EventEmitter {
	constructor(context) {
		super();
		this._context = context;
		this._$template = $(`<div>Please override this Template</div>`);
		this._hasTemplate = true;
	}
	get hasTemplate() {
		return this._hasTemplate;
	}
	get context() {
		return this._context;
	}

	template() {
		return this._$template;
	}

	go() {


	}
	destroy(callback) {
		callback();
	}
	nextState(id, ...params) {
		this.emit('state:change', this);
		this._context.changeState(id, ...params);
	}
}

module.exports = State;
