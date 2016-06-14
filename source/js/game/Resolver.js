let resolver = {
	buckets: function(cb) {
		require.ensure([ "./engines/buckets/index.js" ], (require) => {
			cb(require("./engines/buckets/index.js"));
		}, "buckets");
	},
	pixels: function(cb) {
		require.ensure([ "./engines/pixels/index.js" ], (require) => {
			cb(require("./engines/pixels/index.js"));
		}, "pixels");
	},
	rearrange: function(cb) {
		require.ensure([ "./engines/rearrange/index.js" ], (require) => {
			cb(require("./engines/rearrange/index.js"));
		}, "rearrange");
	},
	unscramble: function(cb) {
		require.ensure([ "./engines/unscramble/index.js" ], (require) => {
			cb(require("./engines/unscramble/index.js"));
		}, "unscramble");
	}
};
module.exports = resolver;
