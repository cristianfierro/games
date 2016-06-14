class Debugger {
	constructor(tolerance) {
		this._tolerance = {
			silent: 0,
			error: 10,
			warning: 20,
			info: 30,
			log: 40,
			all: 50
		};

		this._level = this._tolerance[tolerance] || this._tolerance.silent;
	}
	log() {
		if (console && this._level >= 40) {
			console.log(...arguments);
		}
	}
	info() {
		if (console && this._level >= 30) {
			console.info(...arguments);
		}
	}
	error() {
		if (console && this._level >= 10) {
			console.error(...arguments);
		}
	}
	warning() {
		if (console && this._level >= 20) {
			console.warn(...arguments);
		}
	}
}
module.exports = Debugger;
