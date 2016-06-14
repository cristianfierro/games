var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var webpack = require("webpack");
require("shelljs/global");

var config = require("./configs/games.json");
if (!config) {
	console.log("./configs/games.json is missing. This file contains the necessary configuration to output each game iframe template.");
}

var source = "../source", destination = "../dist";

processTemplates();
compileJS();

function processTemplates() {
	/* Processing game.html template */
	_.forEach(config.games, function(item) {
		fs.readFile(path.resolve(__dirname, "./templates/game.html.tmpl"), function(err, data) {
			if (err) {
				console.log("Failed to read game.html.tmpl template. Does the file exist?", err);
			} else {
				var render = _.template(data)(item);

				fs.writeFile(path.resolve(__dirname, "../dist/" + item.game + ".iframe.html"), render, function(err) {
					if (err) {
						console.log("Could not write the rendered template to the destination, directory permissions maybe?", err);
					}
					console.log("Generated " + item.game + ".iframe.html!");
				});
			}
		});
	});
}

function compileJS() {
	console.log("Stating compilation step with webpack, this might take a while to complete...");
	var js = path.resolve(__dirname, source + '/js');
	webpack({
		entry: path.resolve(js, 'app.js'),
		output: {
			path: path.resolve(__dirname, destination),
			filename: 'app.js',
			chunkFilename: "[name].js"
		},
		module: {
			loaders: [
				{
					loader: 'babel-loader',
					test: js
				},
				{
					test: /\.scss$/,
					loaders: ["style", "css", "resolve-url", "sass?sourceMap"]
				},
				{
					test:   /\.(png|gif|jpe?g|svg)$/i,
					loader: 'url?limit=10000'
				},
				{
					test: /\.(eot|svg|ttf|woff|woff2)$/,
					loader: 'file?name=fonts/[name].[ext]'
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			}),
			new webpack.optimize.CommonsChunkPlugin('common.js'),
			new webpack.optimize.DedupePlugin(),
			new webpack.optimize.UglifyJsPlugin()
		],
		debug: false,
		devtool: 'source-map'
	}, function(err) {
		if (err) {
			console.log("Webpack build failed, here is the stack trace:", err);
		} else {
			console.log("Webpack build finished.");
			console.log("Package Task has finished!");
		}
	});
}
