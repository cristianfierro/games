var _ = require( 'lodash' );
// Publish/Subscript micro system attached to JQuery $ object, to simplify broadcasting of events. This module is required but not used so that
//		webpack automatically bundles it in the output script
var PubSub = require( './PubSub' ); //eslint-disable-line
var AssetsLoader = require( './AssetsLoader' );
var Debugger = require( './Debugger' );
var Adapter = require( './config/configAdapter' );
require("../../sass/puzzlegame.overlay.scss");
/*
*/
/**
 * PuzzleGame will be responsible of updating the canvas and manage engine events.
 * Engine will emit events like 'Game End' to signal... the end of the game.
 * Engine class WILL be pluggable inside puzzlegame class, engine class will decide if the winning condition is met and will decide how
 *     the animation of the tiles will be done, if they will swap positions of shift them to the right, left, etc.
 */
class PuzzleGame {
	constructor( windowReference, documentReference ) {
		this._window = $( windowReference );
		this._document = $( documentReference );
		this._debug = new Debugger( 'silent' );
		this._loader = new AssetsLoader();
		this._adapter = new Adapter( this._debug );
		this._lastContainerWidth = 0;
		this._lastContainerHeight = 0;
		this._hostSettings = {
			cosmopolitan: {
				fb: '162305873819997',
				twitter: 'Cosmopolitan',
				color1: '#ec008d',
				bodyClass: 'cosmopolitan'
			},
			esquire: {
				fb: '171874009543995',
				twitter: 'Esquire',
				color1: '#333333',
				bodyClass: 'esquire'
			},
			elle: {
				fb: '364664413547847',
				twitter: 'ELLEmagazine',
				color1: '#333333',
				bodyClass: 'elle'
			},
			hdmtech: {
				fb: '0',
				twitter: 'Hearst',
				color1: '#e2e2e2',
				bodyClass: 'default'
			},
			localhost: {
				fb: '0',
				twitter: 'solomania',
				color1: '#e2e2e2',
				bodyClass: 'default'
			}
		};
	}
	start( canvas, json, host, cb ) {
		$.cleanup();
		this._selectedHostSettings = this._hostSettings[host] || this._hostSettings.localhost;
		this._$canvas = $( canvas );

		this._window.off( 'resize' );
		this._window.on( 'resize', _.debounce( this.resizeDetected.bind( this ), 1500, { leading: true } ) );

		this.loadConfiguration( json, cb );
	}
	resizeDetected() {
		if ( this._engine ) {
			this._engine.resize();
		}
	}
	loadConfiguration( jsonUrl, cb ) {
		$( '#list', this._document ).hide();
		$( '#loader-wrapper', this._document ).removeClass( 'loaded' );
		$( '#loader-wrapper', this._document ).show();
		this._debug.log( 'Loading Configuration...' );

		$.getJSON( '/data/' + jsonUrl + '.json', ( data ) => {
			this.translateConfiguration( data, cb );
		} );
	}
	translateConfiguration( configuration, cb ) {
		this._adapter.translate( configuration, ( error, config ) => {
			if ( config ) {
				this._configuration = config;
				this._configuration.settings.host = this._selectedHostSettings;
				$( 'body', this._document ).addClass( this._configuration.settings.host.bodyClass );
				this._debug.info( this._configuration );
				this.loadAssets(cb);
			} else {
				this._debug.error( 'Error translating Configuration File' );
				cb && cb('Error translating Configuration File', null);
			}

		} );
	}
	loadAssets(cb) {
		this._debug.log( 'Preloading Assets...' );
		this._loader.processQueue( this._configuration.settings.resources );
		this._loader.startDownload( () => {
			this._debug.log( 'Assets have been Downloaded' );
			this.configureEngine(cb);
		} );
	}
	configureEngine(cb) {
		this._debug.log( 'Configuring Engine...' );

		this._steps = 0;

		let resolver = require( "./Resolver" );
		resolver[this._configuration.gametype]( ( DynamicEngine ) => {
			this._engine = new DynamicEngine( this._$canvas, this._loader, this._configuration );
			this.createBoard(cb);
		} );
	}
	createBoard(cb) {
		this._debug.log( 'Creating Game Board....' );

		this._engine.start( () => {
			this._debug.log( 'Game Board has been Created!' );
			this.startGameScreen(cb);
		} );
	}
	startGameScreen(cb) {
		this._debug.log( 'Starting Game...' );
		$( '#loader-wrapper', this._document ).fadeOut(() => {
			cb && cb(); //call the callback if one has been provided
		});
	}
}

module.exports = PuzzleGame;
