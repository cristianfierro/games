var _ = require('lodash');

class AssetsLoader {
	constructor() {
		this._downloadQueue = [];
		this._successCount = 0;
		this._errorCount = 0;
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
		let gifFile = /\.gif$/;
		if (this._downloadQueue.length === 0) {
			callback();
		}
		for (var i = 0, len = this._downloadQueue.length; i < len; i++) {
			//check if item has url property -> unscramble json will send empty items...
			if (this._downloadQueue[i].url) {
				var img = new Image();
				img.addEventListener("load", () => {
					this._successCount += 1;
					if (this.isDone()) {
						callback();
					}
				}, false);
				img.addEventListener("error", () => {
					this._errorCount += 1;
					if (this.isDone()) {
						callback();
					}
				}, false);
				if (gifFile.test(this._downloadQueue[i].url)) {
					//url looks like it belongs to a gif file
					img.src = this._downloadQueue[i].url;
				} else {
					//Prioritize crop url over image url
					img.src = this._downloadQueue[i].crop.url ? this._downloadQueue[i].crop.url : this._downloadQueue[i].url;
				}
				this._downloadQueue[i].image = img;
			} else {
				this._successCount++;
			}
		}
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
