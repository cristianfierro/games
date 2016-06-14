/* eslint-disable */
var path = require("path");

var js = path.resolve(__dirname, 'source/js');
var build = path.resolve(__dirname);
const webpack = require('webpack');

module.exports = {
    entry: path.resolve(js, 'app.js'),
    output: {
        path: build,
        publicPath: '/',
        filename: 'app.js',
        chunkFilename: "[name].js"
    },
    module: {
        loaders: [
            {
                test: js,
                loader: 'babel-loader'
            },
            {
                test: /\.scss$/,
                loaders: ["style", "css", "resolve-url", "sass?sourceMap"]
            },
            {
                test:   /\.(png|gif|jpe?g|svg)$/i,
                loader: 'url?limit=10000',
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
                'NODE_ENV': JSON.stringify('development')
            }
        })
    ],
    // Create Sourcemaps for the bundle
    devtool: 'source-map',
    devServer: {
        contentBase: build,
    },
};
