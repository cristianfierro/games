/* eslint-disable */
// Karma configuration
// Generated on Mon May 23 2016 15:42:17 GMT-0500 (ECT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'source/scripts/jquery-1.12.3.min.js',
      'source/scripts/Draggable.js',
      'source/scripts/TweenLite.js',
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      'test-context.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'test-context.js': ['webpack']
    },
    webpack: {
        module: {
            loaders: [
                {
                    test: /\.js/, exclude: /node_modules/, loader: 'babel-loader'
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
        watch: true
    },
    webpackMiddleware: {
        noInfo: true
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
