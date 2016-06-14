var Analytics = require('../Analytics');
var EventEmitter = require('events').EventEmitter;

class EngineContext extends EventEmitter {
	constructor(container, loader, id, gametype) {
		super();
		this._loader = loader;
		this._$container = container;
		this._states = [];
		this._currentState = null;
		this._analytics = new Analytics(id, gametype);
	}

	get loader() {
		return this._loader;
	}

	get analytics() {
		return this._analytics;
	}

	get container() {
		return this._$container;
	}

	get states() {
		return this._states;
	}

	start(callback) {
		if (callback) callback();
	}
	resize(callback) {
		if (callback) callback();
	}

	registerState(id, state) {
		this.emit("engine:register-state", this, id, state);
		this._states[id] = state;
		return state;
	}

	changeState(id, ...params) {
		this.emit("engine:change", this, id, ...params);
		if (this._states[id].hasTemplate) {
			this._$container.empty();
			this._$container.append(this._states[id].template());
		}
		if (this._currentState) {
			this._currentState.destroy(() => {
				this._currentState = this._states[id];
				this._currentState.go(...params);
			});
		} else {
			this._currentState = this._states[id];
			this._currentState.go(...params);
		}
	}
}

module.exports = EngineContext;
