class Analytics {
	constructor(id, type) {
		this._type = type;
		this._id = id;
	}

	record(message, attributes = {}, metrics = {}) {
		$(window).trigger("analytics:record", [this._type, this._id, message, attributes, metrics]);
	}

	submit() {
		$(window).trigger("analytics:submit");
	}
}

module.exports = Analytics;
