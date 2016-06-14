/**
* @deprecated The new format is no longer being used since it needs to be changed. This file will still be here to be used as example.
*/
class Parser {
	constructor(json) {
		this._json = json;
	}
	get settings() {
		return this._json.settings;
	}
	get gametype() {
		return this._json.gametype;
	}
}

module.exports = Parser;
