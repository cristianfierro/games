var _ = require('lodash');

class AssetsLoader {
	constructor() {
		this._downloadQueue = [];
	}
	processQueue(resources) {
		this._downloadQueue = [];
		_.forEach(resources.images, (resource) => {
			this._downloadQueue.push(resource);
		});
	}
	get downloadQueue() {
		return this._downloadQueue;
	}
	startDownload(callback) {
		callback && callback();
	}
	isDone() {
		return (this._downloadQueue.length == this._successCount + this._errorCount);
	}
	getAsset(id) {
		return _.find(this._downloadQueue, { "id": id });
	}
	getAllAssets() {
		return this._downloadQueue;
	}
}
module.exports = AssetsLoader;
