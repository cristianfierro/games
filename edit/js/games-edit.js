// JS bootstrap for Games Edit
var game = game || {};

Dropzone.autoDiscover = false;

var lsKey = 'game-in-process';
var savedgame = localStorage.getItem( lsKey );
var defaultdata = {id: 'test-game', config_version: "1.0.0", gametype:'rearrange', slides: {} };
var gamedata = defaultdata;


// load config from server
var settings = {};
var getConfig = function() {
	$.getJSON( '/edit/config.json', loadConfig );
}
var loadConfig = function( data ) {
	// merge the loaded config into settings
	$.extend( settings, data );
	user.init();
	editor.init();
}
getConfig();

// default, see below for user prefs
var previewurl = "/dist/games.iframe.html?game=";


// custom is the editor (for now) TODO add to config
//var hipsPrefix = "http://games-dev.hdmtech.net:6116/custom";
var hipsPrefix = "http://games-hips-dev.hdmtech.net/custom";
// feature flag for HIPS
var useHips = false;
var games = [];
var edit = {}; // TODO encompass all below

// TODO move and load?
settings.answerSourceDraggableOpts = {
	containment: "window",
	helper: "clone",
	scope: "answers"
	}
settings.slideAnswerDraggableOpts = {
	containment: "window",
	scope: "answers",
	tolerance: "pointer",
	appendTo: "#editor",
	helper: "clone"
	}

if ( typeof savedgame == 'string' ) {
	try {
		gamedata = JSON.parse( savedgame );
		// add a config version if there's none
		// TODO add to editor config
		if ( ! gamedata.config_version ) {
			gamedata.config_version = "1.0.0";
		}
	} catch ( e ) {
		console.log( 'discarding invalid saved game: ' + savedgame );
	}
}

$(function() {
	// enumerate the gametypes available
	// TODO get from settings / config.json
	edit.gametypes = [];
	$( "#game-type option" ).each( function() {
		edit.gametypes.push( $( this ).val() );
	});

	// call handleSwitchTab when a tab is changed (bootstrap)
	$( 'a[data-toggle="tab"]' ).on( 'shown.bs.tab', handleSwitchTab );

	// enable tooltips (bootstrap)
	$( '[data-toggle="tooltip"]').tooltip();

	$.get( '/edit/main.html', function( data ) {
		$( "#main-html" ).html( data );
		$( "#demo-iframe" ).iFrameResize();
	});
	// manage the main nav
	$( document ).on( 'click', 'a.page-mode', function() {
		var mode = $( this ).data( 'mode' );
		if ( mode == "create" ) {
			editor.showTab( "#new" );
		} else {
			editor.hide();
		}
		editor.mode( mode );
	});

});

var editor = editor || {};

// grab query params
editor.getQueryParams = function() {
	var vars = [], hash;
	var q = document.URL.split('?')[1];
	if ( q != undefined ) {
		q = q.split('&');
		for ( var i = 0; i < q.length; i++ ) {
			hash = q[i].split('=');
			vars.push(hash[1]);
			vars[hash[0]] = hash[1];
		}
	}
	editor.queryParams = vars;
}

// this only runs after the settings are loaded
editor.init = function() {

	// add MOTD or remove
	if ( settings.motd ) {
		$( '#motd' ).html( settings.motd ).show();
	}

	// switch user to saved tab
	// allow query params to override for deep links
	// e.g. http://games-edit-dev.hdmtech.net/edit/?go=tab:games;game:test-game

	editor.getQueryParams();

	if ( editor.queryParams['go'] == "to" ) {
		editor.showTab( '#' + editor.queryParams['tab'] );
		editor.setGame( editor.queryParams['game'] );
		return; // wait for reload
	}
	var mode = editor.getMode();
	if ( mode == "create" ) {
		var userTab = user.getTab();
		if ( ! userTab ) {
			userTab = '#new';
		}
		editor.showTab( userTab );
	} else {
		editor.hide();
	}
	editor.mode( mode );

	// enumerate the user pref items
	var userEnv = user.getEnv();
	for ( var i in settings.targets ) {
		$newDeployOption = $( '<option/>' ).val( i ).text( settings.targets[i].label );
		if ( i == userEnv ) {
			$newDeployOption.attr( "selected", "selected" );
		}
		$( "#deploy-type" ).append( $newDeployOption );
	}
	$( "#deploy-type" ).on( "change", editor.changeDeployType );
	getGames();
	setupEditor();

	// set up clipboard for the share clip button
	// https://clipboardjs.com/
	editor.clipboard = new Clipboard( ".share-clip" );
	editor.clipboard.on( 'success', editor.showClipSuccess );
	editor.clipboard.on( 'error', console.log );

	updateEmbedCodes();

	game.invalidate();
	$( document ).on( "user:changed", editor.userWasUpdated );
	handleReload();
}

// change editor mode. Typically also change the UI, but can be disabled with false as 2nd param
editor.mode = function( mode, changeUI ) {
	if ( typeof changeUI == "undefined" ) {
		changeUI = true;
	}
	if ( changeUI ) {
		$( 'body' ).removeClass( 'main create gallery' ).addClass( mode );
		$( '.editnav-main,.editnav-gallery,.editnav-create' ).removeClass( 'active' );
		$( '.editnav-' + mode ).addClass( 'active' );
	}
	localStorage.setItem( 'page-mode', mode );
}

editor.getMode = function() {
	return localStorage.getItem( 'page-mode' ) || 'main';
}

editor.changeDeployType = function( e ) {
	user.setEnv( $( "#deploy-type" ).val() );
}
// hide the editor stuff
editor.hide = function() {
	$( ".tab-content" ).hide();
}
editor.showTab = function( tab ) {
	$( '.tab-content' ).show();
	// bootstrap docs are a bit misleading, this is how you do it
	$( '#navTabs a[href="' + tab + '"]' ).tab( "show" );
	editor.setShareTab( tab );
}
editor.userWasUpdated = function( ) {
	editor.setShareTab( user.getTab() );
}
editor.setShareTab = function( tab ) {
	var url = document.location.origin + "/edit/?go=to&tab=" + tab.replace(/#/,'') + "&game=" + gamedata.id;
	$( '#share-go-clip' ).attr( "data-clipboard-text", url );
}
editor.setGame = function( gameId ) {
	console.log( 'Loading ' + gameId );
	$.getJSON( '/data/' + gameId + '.json', loadGame );
}
editor.showClipSuccess = function( e ) {
	showMessage( { html: 'Something was saved to your clipboard', type: "success" } );
}
/**
 * create button settings in editor using Bootstrap radio btn
 *
 *
 * @param hash options = {
			id: "randomizeOrder",
			type: "radioButton",
			label: "Order",
			description: "Randomize the slides?",
			defaultSetting: "yes",
			buttons: [ { id: "yes", label: "Random" }, { id: "no", label: "Fixed" } ]
			};
 * @return boolean invalidation flag (if game data was changed)
*/
editor.addButtonSettings = function( options, gametype ) {
	// TODO handle multiple gametypes (ie same control, 3 game types)
	var invalidate = false;
	var id = options.id;
	// Bootstrap button group
	$( "#game-settings" ).append(
		'<div class="control control-conditional control-show-' + gametype + '"><strong>' + options.label + '</strong> ' +
			'<div class="btn-group btn-group-xs control-setting" data-toggle="buttons" data-game-attr="' + id + '"' +
				'id="game-setting-' + id + '" title="' + options.description + '">' +
			'</div>' +
		'</div>' );
	var current = options.defaultSetting;
	if ( ( ! gamedata.settings ) || ( ! gamedata.settings.hasOwnProperty( id ) ) ) {
		gamedata.settings = gamedata.settings || {};
		gamedata.settings[ id ] = current;
		invalidate = true;
	} else {
		current = gamedata.settings[ id ];
	}
	for ( var button in options.buttons ) {
		var key = options.buttons[ button ].id;
		var label = options.buttons[ button ].label;
		var active = '';
		if ( current == key ) {
			active = 'active';
		}
		$( '#game-settings div[data-game-attr="' + id + '"]' ).append(
			'<label class="btn btn-primary ' + active + '">' +
				'<input type="radio" name="' + id + '" data-value="' + key + '" autocomplete="off">' + label +
			'</label>'
			);
	}
	$( '#game-setting-' + id + ' .btn' ).on( "click", handleButtonChange );

	return invalidate;
}

/**
 * create slider for settings
		var options = {
			id: "slideduration",
			type: "rangeSlider",
			label: "Time per slide",
			description: "Amount of time each slide allows",
			defaultSetting: 20,
			range: { max: 30, min: 5, step: 1 },
			units: "seconds"
			};
		var updated = editor.addRangeSettings( options, gametype );
 */
editor.addRangeSettings = function( options, gametype ) {
	var invalidate = false;
	var id = options.id;
	// Bootstrap range slider, see http://seiyria.com/bootstrap-slider/
	var step = options.range.step || 1;
	var max = options.range.max || 30;
	var min = options.range.min || 1;
	var units = options.units || '';

	// set default if necessary
	var current = options.defaultSetting;
	if ( ( ! gamedata.settings ) || ( ! gamedata.settings.hasOwnProperty( id ) ) ) {
		gamedata.settings = gamedata.settings || {};
		gamedata.settings[ id ] = current;
		invalidate = true;
	} else {
		current = gamedata.settings[ id ];
	}

	// add to DOM
	$( "#game-settings" ).append(
		'<div class="control control-conditional control-show-' + gametype + '"><strong>' + options.label + '</strong> ' +
			'<b>' + min + units + '</b> ' +
			'<input class="control-slider control-setting" data-slider-id="' + id + 'Slider" type="text" data-slider-min="' + min + '" ' +
			'data-slider-max="' + max + '" data-slider-step="' + step + '" data-slider-value="' + current +
			'" data-game-attr="' + id + '"' + 'id="game-setting-' + id + '" title="' + options.description + '"/>' +
			' <b>' + max + units + '</b>' +
		'</div>' );
	$( '#game-setting-' + id ).bootstrapSlider({
		formatter: function( value ) {
			return value + units;
		}
	}).on( 'slideStop', editor.handleSliderChange );

	return invalidate;
}

editor.handleSliderChange = function( e ) {
	var value = e.value;
	var key = $( this ).data( 'game-attr' );
	game.changeSetting( key, value );
}

// run when the page reloads, in case of messages or tabs to display
var handleReload = function() {
	var loadJson = localStorage.getItem( 'editor-onload' );
	if ( typeof loadJson == 'string' ) {
		var load = JSON.parse( loadJson );
		if ( load.messages ) {
			for ( var i = 0; i < load.messages.length; i++ ) {
				showMessage( load.messages[ i ] );
			}
		}
		if ( load.tab ) {
			editor.showTab( load.tab );
		}
	}
	localStorage.setItem( 'editor-onload', '{}' );
}

var showMessage = function( message ) {
	var type = "info";
	var html = message;
	if ( typeof message == "object" ) {
		html = message.html;
		type = message.type;
	}
	// TODO add dismissible
	var dismissible = '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
		'<span aria-hidden="true">&times;</span></button>';
	html = dismissible + html;
	$('<div role="alert" class="alert alert-dismissible alert-' + type + '"/>' ).html( html ).prependTo( "#alerts" );
}

// handler for editable strings
// set data-game-attr="id" to change gamedata.id, etc
var editGameAttribute = function( e ) {
	var attr = $( e.target.selector ).data('game-attr');
	gamedata[ attr ] = e.value;
	game.invalidate();
}

// use bootstrap to fire
var handleSwitchTab = function( e ) {
	if ( e.target.hash == "#player" ) {
		var previewurl = $( this ).find( "input" ).attr( 'data-value' );
		startPreview( previewurl );
	}
	user.setTab( e.target.hash );
}
var startPreview = function( previewurl ) {
	console.log( "starting preview for " + gamedata.id );
	// add the control
	// one iframe per game type
	$playerFrame = $( '<iframe width="100%" height="600" id="player-frame" class="no-margin" style="overflow:hidden;" frameborder="0" src=""></iframe>' );
	$playerFrame.attr( "src", previewurl + gamedata.id );
	$( "#player-frame" ).remove();
	$( "#player #preview-picker" ).after( $playerFrame );
	$( "#player-frame" ).iFrameResize( [{}] );
}

// handle caption editing, replacing placeholder when necessary
var editCaption = function( e ) {
	var target = $( e.target.selector ).parent().attr( "id" );
	var caption = e.value;
	if ( e.value == $( e.target.selector ).data( "placeholder" ) ) {
		caption = '';
	}
	gamedata.slides[ target ].caption = caption;
	setCaption( target, caption );
	game.invalidate();
}

var setupEditor = function() {
	$( "#game-id" ).html( gamedata.id );
	$( "#game-challenge" ).html( gamedata.challenge || 'Rearrange the photos' );
	// set up the game for this type
	editor.setGameType( gamedata.gametype );


	$( "#game-id" ).editable( "click", editGameAttribute );
	$( "#game-challenge" ).editable( "click", editGameAttribute );
	$( "#game-type" ).on( "change", handleGameTypeChange );


	$( document ).on( "click", ".game-list-item", handleListClick );
	$( document ).on( "click", ".edit-icon", handleEditClick );

	// Delete gallery item action
	$( document ).on( "click", ".delete-icon", showDeleteConfirm );

	// settings TODO maybe use this pattern for the other stuff?
	//$( document ).on( "change", ".control-setting", editGameSetting );
/*
	for ( var setting in gamedata.settings ) {
		$( '#game-setting-' + setting ).val( gamedata.settings[ setting ] );
	}
*/
	// general action handler
	$( document ).on( "click", ".action", handleAction );
	$( document ).on( "click", ".crop-handle", startCrop );
	$( document ).on( "click", ".modal-close", cancelCrop );

	// reorder per the list - skip the last one, it'll be in the right place :-)
	var orderedSlides = editor.getMaxSlides();
	// first make sure we have all the divs
	for ( var i = 0; i < orderedSlides.length; i++ ) {
		var id = orderedSlides[ i ];
		// skip if there's no data for this
		if ( $.isEmptyObject( gamedata.slides[ id ] ) ) {
			continue;
		}
		// add extras if they are needed
		if ( ! $( '#' + id ).length ) {
			addImagePlaceholder( id );
		}
	}
	// now we can sort them (this doesn't work if you don't have everything in the DOM)
	// NOTE we are skipping the very last item, it will fall into place :-)
	for ( var i = 0; i < orderedSlides.length - 1; i++ ) {
		var id = orderedSlides[ i ];
		$( "#" + id ).detach().insertBefore( $( ".dd-slide:eq( " + i + " )" ) );
	}

	// slide set up // based on type, may need to create an extra empty item
	var minLength = editor.getMinSlides();
	for ( var i = 0; i < minLength; i++ ) {
		var label = "image" + ( i + 1 );
		if ( orderedSlides.indexOf( label ) < 0 ) {
			// add to game
			orderedSlides.push( label );
			gamedata.slides[ label ] = { };
		}
		// NOW add extras if they are needed
		if ( ! $( '#' + label ).length ) {
			// add to dom
			addImagePlaceholder( label );
		}
	}
	var droppables = {};
	for ( var i = 0; i < orderedSlides.length; i++ ) {
		var target = orderedSlides[ i ];
		var newDrop = new Dropzone( '#' + target + ' .image-dropzone', { url: '/edit/upload.php' } );
		newDrop.on( "success", dropSuccess );
		newDrop.on( "addedfile", dropAddedFile );
		droppables[ target ] = newDrop;
		if ( typeof gamedata.slides[ target ] == "object" ) {
			var slide = gamedata.slides[ target ];
			if ( slide.url ) {
				setImage( target, slide );
			}
			if ( slide.caption ) {
				setCaption( target, slide.caption );
			}
		}

		// captions
		$("#" + target + " .editable-caption").editable( "click", editCaption );
	}

	// make sortable
	$( ".sortable-images" ).sortable({
		cursor: "move",
		update: handleImageSort,
		handle: ".sort-handle"
	});

	// make preview button set for use on Player tab
	$( '<div class="btn-group btn-group-justified" id="preview-picker" data-toggle="buttons"/>' ).prependTo( "#player" );
	var active = "active";
	var options = [ 'dev', 'stage', 'prod' ];
	for ( var target of options ) {
		if ( settings.targets.hasOwnProperty( target ) ) {
			var t = settings.targets[ target ];
			$( '#preview-picker' ).append(
				'<label class="btn btn-primary ' + active + '">' +
					'<input type="radio" name="' + t.id + '-preview" data-value="' + t.preview + '" autocomplete="off">' + t.label +
				'</label>'
				);
			active = "";
			if ( t.player ) {
				$( '#preview-picker' ).append(
					'<label class="btn btn-primary ' + active + '">' +
						'<input type="radio" name="' + t.id + '-player" data-value="' + t.player + '" autocomplete="off">' + t.label + ' (CDN)' +
					'</label>'
					);
			}
		}
	}
	$( "#preview-picker" ).on( "click", "label", editor.changePlayer );

	// do this last, so expected DOM elements are present
	doTypeSpecificSetup( gamedata.gametype );
}

editor.changePlayer = function( e ) {
	$( this ).button( 'toggle' );
	var previewurl = $( this ).find( "input" ).attr( 'data-value' );
	startPreview( previewurl );
}

// get the slide ids we are actually using for this game
editor.getMaxSlides = function() {
	var orderedSlides = Object.keys( gamedata.slides );
	// TODO pull from the config settings for the game type
	switch ( gamedata.gametype ) {
	case 'unscramble':
		return orderedSlides.slice( 0, 1 );
		break;
	case 'rearrange':
		return orderedSlides.slice( 0, 6 );
		break;
	case 'pixels':
	default:
		return orderedSlides;
	}
}

// calculate the number of image placeholders needed in case we need "empty" slots
editor.getMinSlides = function() {
	var orderedSlides = [];
	for ( var key in gamedata.slides ) {
		if ( $.isEmptyObject( gamedata.slides[ key ] ) ) {
			continue;
		}
		orderedSlides.push( key );
	}
	var currentSlides = orderedSlides.length;
	var type = gamedata.gametype;
	// TODO pull from the config settings for the game type
	switch ( type ) {
	case 'unscramble':
		return 1;
		break;
	case 'rearrange':
		return 6;
		break;
	case 'pixels':
		// can always add another
		return currentSlides + 1;
		break;
	default:
	}
	return 1;
}

// insert a new image placeholder into the DOM
var addImagePlaceholder = function( id ) {
	var where = "end"; // "start" or "end" TODO config per-game
	if ( $( '#' + id ).length ) {
		return false;
	}
	var html = '<div id="' + id + '" class="dd-slide editable-image">' +
		'<div class="preview"></div>' +
		'<span class="dropzone image-dropzone">' +
		'<span class="dz-message"></span>' +
		'</span>' +
		'<span class="sort-handle"><span class="glyphicon glyphicon-move"/></span>' +
		'<span class="crop-handle"><span class="glyphicon glyphicon-scissors"/></span>' +
		'<span data-placeholder="Caption_This" class="editable-caption dd-caption default">Caption_This</span>' +
		'</div>';
	if ( where == "start" ) {
		$( '#edit-container' ).prepend( html );
	} else {
		$( '#edit-container' ).append( html );
	}
}

// dropzone event handlers
editor.filesUploading = {};
// see http://www.dropzonejs.com/#configuration

// track each file as it's added to the upload queue
var dropAddedFile = function( file ) {
	var id = this.element.offsetParent.id;
	// this object can look like
	// { 'image1': [ 'foobar.jpg', 'cat.jpg' ],
	//   'image2': [ 'dog.jpg' ] }
	// by tracking the multi-uploads we can push the extra items down to the
	// next empty image bucket (if available)
	editor.filesUploading[ id ] = editor.filesUploading[ id ] || [];
	editor.filesUploading[ id ].push( file.name );
}

// handle new file uploaded (success)
// calculate a default crop
// update the data & preview
var dropSuccess = function( file, response ) {
	var id = this.element.offsetParent.id;

	var landingFiles = editor.filesUploading[ id ];

	// if it's the first then simple upload, replace
	// else add a target for it and put it there
	if ( landingFiles[ 0 ] != file.name ) {
		id = editor.getNextImageId( id );
		// it's not in the DOM, so add it
		addImagePlaceholder( id );
	}
	var $imageTarget = $( '#' + id );
	$imageTarget.addClass('image-taken');

	// create image data with default crop
	var target = {};
	target.width = $imageTarget.width()
	target.height = $imageTarget.height();
	var image = {};
	image.width = file.width;
	image.height = file.height;
	image.crop = getDefaultCrop( image, target );
	image.url = response;

	var oldImage = gamedata.slides[ id ] || {};
	gamedata.slides[ id ] = $.extend( oldImage, image );

	this.removeFile( file );

	// if HIPS feature flag is off, generate a cropped image on the server
	if ( useHips == false ) {
		// ask the server to make a crop TODO this is used 2x - refactor into an editor method
		$.post( '/edit/crop.php', JSON.stringify( { gameid: gamedata.id, id: id, image: gamedata.slides[ id ] } ), finishServerCrop, 'json' );
	} else {
		setImage( id, image );
		game.invalidate();
	}
}

// crude way to find an open image slot
editor.getNextImageId = function( oldid ) {
	var i = 1;
	while ( ( oldid == 'image' + i ) ||
		(  $( '#image' + i ).length && $( '#image' + i ).hasClass('image-taken') ) ) {
		i = i + 1;
	}
	$( '#image' + i ).addClass('image-taken');
	return 'image' + i;
}

// calculate a default crop for an image
// returns coordinates that maximize the crop keeping target ratio
var getDefaultCrop = function( source, target ) {
	var ratioW = source.width / target.width;
	var ratioH = source.height / target.height;
	var ratio = Math.min( ratioW, ratioH );
	var crop = {
		width: Math.round( target.width * ratio ),
		height: Math.round( target.height * ratio )
		};
	crop.left = Math.round( Math.abs( source.width - crop.width ) / 2 );
	crop.top = Math.round( Math.abs( source.height - crop.height ) / 2 );
	return crop;
}

// utility to set up an image bg with HIPS
var setImage = function( id, image ) {
	var url = '';
	if ( typeof image == "string" ) {
		url = image;
	} else if ( image.url ) {
		url = image.url;
		// use original image if this is a gif, else use crop image
		if ( ( ! /.*\.gif$/.test( url ) ) && image.crop && image.crop.url ) {
			url = image.crop.url;
		}
		// usehips is feature flagged
		if ( useHips == true ) {
			// create a HIPS compatible URL
			url = hipsPrefix + image.url;
			if ( image.crop ) {
				var crop = image.crop;
				url += "?crop=" + crop.width + ':' + crop.height + ';' + crop.left + ',' + crop.top;
			}
		}
	} else {
		console.log( 'incompatible image' );
		return;
	}
	$('#' + id ).addClass('image-taken').css( 'background-image', 'url("' + url + '")' );
}

var setCaption = function( id, caption ) {
	var $el = $('#' + id + ' .dd-caption' );
	$el.removeClass('default').text( caption );
	if ( caption == '' || caption == $el.data('placeholder') ) {
		$el.addClass('default').text( $el.data('placeholder') );
	}
}

var dataToCropper = function( image ) {
	var data = {
		width: image.crop.width,
		height: image.crop.height,
		x: image.crop.left,
		y: image.crop.top,
		rotate: 0,
		scaleX: 1,
		scaleY: 1
		}
	return data;
}
var cropperToCrop = function( data ) {
	var crop = {
		width: Math.round( data.width ),
		height: Math.round( data.height ),
		left: Math.round( data.x ),
		top: Math.round( data.y )
		}
	return crop;
}


// deal with cropper
var handleCrop = function( e ) {
}
// use current targeted image to crop
var startCrop = function( e ) {
	var whichitem = $( this ).context.offsetParent.id;
	var image = gamedata.slides[ whichitem ];
	var previewTarget = '#' + whichitem + " .preview";
	if ( ! image.crop ) {
		var $imageTarget = $( '#' + whichitem );
		var target = {};
		target.width = $imageTarget.width()
		target.height = $imageTarget.height();
		image.crop = getDefaultCrop( image, target );
	}
	$( "#image-cropper" ).attr( "src", image.url ).cropper({
		aspectRatio: image.crop.width / image.crop.height,
		data: dataToCropper( image ),
		preview: previewTarget,
		built: initCrop
	});
	$( previewTarget ).show();
	$( "#crop-modal" )
		.data( "editing", whichitem )
		.show()
		.draggable({
			cursor: "crosshair",
			handle: "#modal-header"
		});
}
// init the cropper
var initCrop = function( ) {
	//console.log( $(this).cropper('getData') );
}
// finish crop and update crop data TODO allow abort
var cancelCrop = function( e ) {
	$( "#crop-modal" ).hide();
	var imageData = $( "#image-cropper" ).cropper( 'getData' );
	var crop = cropperToCrop( imageData );
	$( "#image-cropper" ).attr( "src", '' ).cropper('destroy');
	var whichitem = $( "#crop-modal" ).data( "editing" );
	var previewTarget = '#' + whichitem + " .preview";
	$( previewTarget ).hide();
	gamedata.slides[ whichitem ].crop = crop;

	// if HIPS feature flag is off, generate a cropped image on the server
	if ( useHips == false ) {
		// ask the server to make a crop
		$.post( '/edit/crop.php', JSON.stringify( { gameid: gamedata.id, id: whichitem, image: gamedata.slides[ whichitem ] } ), finishServerCrop, 'json' );
	} else {
		setImage( whichitem, gamedata.slides[ whichitem ] );
		game.invalidate();
	}
}

// update crop data with cropped image URL
var finishServerCrop = function( data ) {
	if ( data.id && data.url ) {
		gamedata.slides[ data.id ].crop.url = data.url;
		setImage( data.id, gamedata.slides[ data.id ] );
		game.invalidate();
	}
}

// deal with misc action buttons
var handleAction = function( e ) {
	var command = $( this ).data( "command" );
	switch ( command ) {
	case 'new':
		var gametype = $( this ).data( "new-type" ) || "rearrange";
		var newid = haiku();
		gamedata = defaultdata;
		gamedata.gametype = gametype;
		gamedata.id = newid;
		game.invalidate();
		console.log( 'data reset' );
		localStorage.setItem( 'editor-onload', JSON.stringify( { messages: [ "Edit your new <strong>" + gametype + "</strong> puzzle: "  + newid ], tab: '#editor' } ) );
		// reload, but without any query params
		location.replace( location.origin + '/edit/' );
		break;
	case 'deploy':
		console.log( 'deploying ' + gamedata.id );
		// TODO more data cleaning
		for ( var i in gamedata.slides ) {
			if ( $.isEmptyObject( gamedata.slides[ i ] ) ) {
				delete gamedata.slides[ i ];
			}
		}
		$.post( '/edit/deploy.php', JSON.stringify( { type: user.getEnv(), data: gamedata } ), finishDeploy, 'json' );
		break;
	default:
		console.log( 'unhandled action ' + command );
	}
}

// deal with the game list
var handleListClick = function( e ) {
	var gameId = $( this ).data( "game-id" );
	// user clicked, so have the editor load (with player visible)
	user.setTab( '#player' );
	editor.setGame( gameId );
}

// deals with Edit button under game list
var handleEditClick = function( e ) {
	var gameId = $( this ).data( "game-id" );
	// user clicked, so have the editor load (with player visible)
	user.setTab( '#editor' );
	editor.setGame( gameId );
}


// shows a confirm modal before deleting game
var showDeleteConfirm = function( e ) {
	var gameId = $( this ).attr( 'data-delete-id' );
	confirmDialog (
		"Delete Game (" + gameId + ")",
		"This will irreversibly delete the game and all assets, are you sure you would like to delete it?",
		"Cancel",
		"Yes, Delete",
		deleteGame,
		gameId
	);
}

// Delete game from game list (DynamoDB) by sending Ajax request
var deleteGame = function( gameId ) {
	$.ajax({
		url: '/edit/deploy.php',
		method: 'post',
		data: { 'action': 'delete', 'gameId': gameId },
		success: function( response ) {
			if ( response == '200' ) {
				localStorage.setItem( 'editor-onload', JSON.stringify( { messages: [ "Game Deleted (" + gameId + ")" ], tab: '#gallery' } ) );
				location.reload();
			}
		},
		error: function(  response, xhr ) {
			console.log( response );
			var error_text = "Error Deleting: " + gameId + " - " + response + xhr.responseText;
			showMessage( { html: error_text, type: "danger" } );
		}
	});
}

// deal with deployment success, usually updates the data
var finishDeploy = function( data ) {
	if ( data.success && data.gamedata && data.deployed ) {
		var status = data.deployed;
		if ( typeof data.deployed == "object" ) {
			status = Object.keys(data.deployed).length + " files deployed";
		}
		loadGame( data.gamedata, [ "Game " + data.gamedata.id + " was saved: " + status ] );
	}
}

var getGames = function() {
	$.getJSON( '/edit/games.php', updateGameList );
}

var updateGameList = function( data ) {
	var rowitems = 0;
	for ( var id in data ) {
		$("#game-list-container .row:last").append( '' +
		'<div class="col-md-4 col-sm-6">' +
			'<div class="panel panel-info">' +
				'<div class="panel-heading">' +
				'<b>' + id + '</b>' +
				'</div>' +
				'<div class="panel-body">' +
					'<div><img id="game-thumbnail" src="' + data[id].thumbnail + '" alt="' + id + '"/></div>' +
					'<div id="game-caption">' + data[id].challenge + '</div>' +
				'</div>' +
				'<div class="panel-footer text-info">' +
					'<div class="game-option game-list-item" data-game-id="' + data[id].id + '">' +
						'<span class="glyphicon glyphicon-play-circle"></span> Play' +
					'</div> ' +
					'<div class="game-option edit-icon"  data-game-id="' + data[id].id + '">' +
						'<span class="glyphicon glyphicon-pencil"></span> Edit' +
					'</div> ' +
					'<div class="game-option delete-icon" data-delete-id="' + data[id].id + '">' +
						'<span class="glyphicon glyphicon-trash"></span> Delete' +
					'</div> ' +
				'</div>' +
			'</div>' +
		'</div>');

		rowitems++;
		if ( rowitems >= 3 ) {
			$("#game-list-container").append( '<div class="row"/>' );
			rowitems = 0;
		}
	}
}

// load a new game
// TODO avoid reload
// Safari can't take the declared options in the arg list = {}
var loadGame = function( data, messages ) {
	if ( arguments.length == 1 || typeof messages != "object" ) {
		messages = new Array();
	}
	gamedata = data;
	game.invalidate();
	messages.push( "Game " + data.id + " was loaded" )
	// set new mode to "create" for after reload
	editor.mode( 'create', false );
	user.setTab( '#player' );
	localStorage.setItem( 'editor-onload', JSON.stringify( { messages: messages } ) );
	if ( location.search.length > 0 ) {
		location.replace( location.origin + '/edit/' );
	} else {
		location.reload();
	}
}

// deal with image reorder
var handleImageSort = function( e, ui ) {
	var images = $(this).sortable( "toArray" );
	// rearrange the image hash, clumsily
	var oldlist = gamedata.slides;
	gamedata.slides = {};
	var slideCount = images.length;
	for ( var i = 0; i < slideCount; i++ ) {
		var key = images[ i ];
		gamedata.slides[ key ] = oldlist[ key ];
	}
	game.invalidate();
}

// change and reload when an editor makse a change
var handleGameTypeChange = function( e ) {
	var newtype = $( "#game-type" ).val();
	if ( newtype == gamedata.gametype ) {
	//	console.log( 'no change' );
	//	return;
	}
	gamedata.gametype = newtype;
	// and force a reload
	loadGame( gamedata, [ "Game type changed" ] );
}

// this should be called when a game is loaded
editor.setGameType = function( gametype ) {
	// this may be redundant
	var nicetypes = {
		'pixels': 'Pixels - Identify pixelated images',
		'rearrange': 'Rearrange - Put images in order',
		'unscramble': 'Unscramble - Put pieces of the image in place'
		}
	$( "#game-type" ).text( nicetypes[ gamedata.gametype ] );
	$("#editor").removeClass( edit.gametypes.join( " " ) ).addClass( gamedata.gametype );
}

var doTypeSpecificSetup = function( gametype ) {
	var rememberToInvalidate = false;

	switch ( gametype ) {
	case 'pixels':
		// enumerate the possible answers, and add them to the DOM
		var slides = gamedata.slides;
		var labels = [];
		for ( var imageId in slides ) {
			var slide = slides[ imageId ];
			if ( slide.answers ) {
				$( '#' + imageId ).append( '<div class="answer-list"/>' );
				$thisAnswerList = $( '#' + imageId + ' .answer-list' );;
				for ( var i = 0; i < slide.answers.length; i++ ) {
					var answer = slide.answers[ i ];
					// TODO sanitize caption here
					if ( ! answer.caption ) {
						continue;
					}
					// add to master list, only once
					if ( labels.indexOf( answer.caption ) == -1 ) {
						labels.push( answer.caption );
					}

					// add to DOM, noting if correct
					var correct = "answer-incorrect";
					if ( answer.correct && answer.correct == true ) {
						correct = "answer-correct";
					}
					var $newDiv = $( '<div class="answer hvr-float-shadow ' + correct + '" />' ).text( answer.caption );
					$thisAnswerList.append( $newDiv );
				}
			}
		}
		labels.sort();
		// add possible answers to the edit area
		$( "#edit-container" ).after( '<div class="answer-list" id="answer-list"/>' );
		var $answerList = $( "#answer-list" );
		$answerList.append( '<div id="add-answer" data-toggle="tooltip" class="pseudo-answer" title="Type a new answer and hit enter">Add Answer</div>' );
		labels.forEach( function( label ) {
			// edit any of the answers with a double-click
			var $newDiv = $( '<div class="answer hvr-float-shadow" />' )
				.text( label )
				.editable( "dblclick", handleChangeAnswer );
			$answerList.append( $newDiv );
		});
		// edit the first item with a single click
		$( '#add-answer' ).editable( "click", handleNewAnswer );
		// drag any of the answers ( to an image to add them )
		$( "#answer-list .answer" ).draggable( settings.answerSourceDraggableOpts );

		// double click any answer in an image to make it the "correct" one
		$( document ).on( "dblclick", ".editable-image .answer-list .answer", handleAnswerDoubleClick );
		// answers will be added to a slide when dropped there
		$( ".dd-slide" ).droppable({
			accept: ".answer",
			scope: "answers",
			tolerance: "pointer",
			drop: handleAnswerDrop
		});
		// answers can be dragged away from a slide ( drop in main list to remove from slide )
		$( ".dd-slide .answer-list .answer" ).draggable( settings.slideAnswerDraggableOpts );
		$( "#answer-list" ).droppable({
			accept: ".answer",
			scope: "answers",
			tolerance: "pointer",
			drop: handleAnswerListRemove
		});

		// settings
		// Radio button for randomizeOrder
		var options = {
			id: "randomizeOrder",
			type: "radioButton",
			label: "Order",
			description: "Randomize the slides?",
			defaultSetting: "yes",
			buttons: [ { id: "yes", label: "Random" }, { id: "no", label: "Fixed" } ]
			};
		var updated = editor.addButtonSettings( options, gametype );
		rememberToInvalidate = rememberToInvalidate || updated;

		// Slider for slideduration
		var options = {
			id: "slideduration",
			type: "rangeSlider",
			label: "Time per slide",
			description: "Amount of time each slide allows",
			defaultSetting: 20,
			range: { max: 30, min: 5, step: 1 },
			units: "s"
			};
		var updated = editor.addRangeSettings( options, gametype );
		break;
	case 'rearrange':
		break;
	case 'unscramble':
		// settings - complexity
		var options = {
			id: "complexity",
			type: "radioButton",
			label: "Complexity",
			description: "Select scramble difficulty",
			defaultSetting: "easy",
			buttons: [ { id: "easy", label: "Easy: 3 x 2" }, { id: "hard", label: "Hard: 5 x 3" } ]
			};
		var updated = editor.addButtonSettings( options, gametype );
		rememberToInvalidate = rememberToInvalidate || updated;

		break;
	default:
		console.log( 'unknown type ' + gametype );
	}

	if ( rememberToInvalidate ) {
		game.invalidate();
	}
}

// button clicked in btn group
var handleButtonChange = function( e ) {
	var value = $( this ).find( 'input' ).data( 'value' );
	var key = $( this ).parents( '.btn-group' ).data( 'game-attr' );
	game.changeSetting( key, value );
}

// add a newly typed answer
// supports multiples if separated by commas
var handleNewAnswer = function( e ) {
	if ( e.value == e.old_value ) {
		return;
	}
	var re = /\s*[;,]\s*/;
	var answers = e.value.split( re );
	for ( var i = 0; i < answers.length; i++ ) {
		game.addNewAnswer( answers[i] );
	}
	$( "#add-answer" )
		.text( e.old_value );
}

// change all matching answers when a label on the main list is changed
var handleChangeAnswer = function ( e ) {
	if ( e.value == e.old_value ) {
		return;
	}
	game.updateAnswerText( e.value, e.old_value );
}

var handleAnswerDoubleClick = function( e ) {
	var text = $( this ).text();
	var id = $( this ).parents( '.editable-image' ).attr( 'id' );
	game.changeCorrectAnswer( id, text );
}

var handleAnswerListRemove = function( e, ui ) {
	var text = $( ui.draggable.context ).text();
	var dropId = $( this ).attr( "id" );
	var fromId = ui.draggable.parents( ".dd-slide" ).attr( "id" );
	if ( dropId == 'answer-list' ) {
		game.removeAnswerFromSlide( fromId, text );
	}
}

// handle new answer being added to an image
// make sure it's not in the list already, then add
var handleAnswerDrop = function( e, ui ) {
	var text = $( ui.draggable.context ).text();
	var id = $( this ).parents( '.editable-image' ).context.id;
	game.addAnswerToSlide( id, text );
}

// when the game data changes, save it to local storage and update the JSON textarea
var handleEditChanges = function( ) {
	localStorage.setItem( lsKey, JSON.stringify( gamedata ) );
	// $( "#json-container" ).val( JSON.stringify( gamedata, null, '\t' ) );
	updateEmbedCodes();

}

var updateEmbedCodes = function() {
	// update embed URLs
	if ( settings.targets.hasOwnProperty( 'prod' ) ) {
		var produrl = settings.targets['prod'].player;
		$( "#share-prod" ).attr( "data-clipboard-text", '<iframe width="100%" height="600" frameborder="0" style="overflow:hidden;" src="' +
			produrl + gamedata.id + '" class="hearst-puzzle-embed no-margin"></iframe>' );
	} else {
		$( "#share-prod" ).hide();
	}
	if ( settings.targets.hasOwnProperty( 'stage' ) ) {
		var stageurl = settings.targets['stage'].player;
		$( "#share-stage" ).attr( "data-clipboard-text", '<iframe width="100%" height="600" frameborder="0" style="overflow:hidden;" src="' +
			stageurl + gamedata.id + '" class="hearst-puzzle-embed no-margin"></iframe>' );
	} else {
		$( "#share-stage" ).hide();
	}
}


game.invalidate = function() {
	handleEditChanges();
}

game.changeSetting = function( settingKey, newValue ) {
	gamedata.settings = gamedata.settings || {};
	gamedata.settings[ settingKey ] = newValue;
	game.invalidate();
}

game.addAnswerToSlide = function( slideId, newAnswerCaption ) {
	game.changeAnswer( slideId, newAnswerCaption, false );
}

game.changeCorrectAnswer = function( slideId, newAnswerCaption ) {
	game.changeAnswer( slideId, newAnswerCaption, true );
}

game.changeAnswer = function( slideId, newAnswerCaption, isCorrect ) {
	var slide = gamedata.slides[ slideId ];
	if ( ( ! slide ) ) {
		return false;
	}
	slide.answers = slide.answers || [];
	var found = false;
	var correctAnswer = "-----";
	for ( var i = 0; i < slide.answers.length; i++ ) {
		var answer = slide.answers[ i ];
		if ( answer.caption && ( answer.caption == newAnswerCaption ) ) {
			answer.correct = isCorrect;
			found = true;
		} else if ( isCorrect && ( answer.correct == true ) ) {
			// there can be only one
			answer.correct = false;
		}
		if ( answer.correct == true ) {
			correctAnswer = answer.caption;
		}
		slide.answers[ i ] = answer;
	}
	// make sure slide has an answer-list div
	if ( $( '#' + slideId + ' .answer-list' ).length <= 0 ) {
		$( '#' + slideId ).append( '<div class="answer-list">' )
	}
	if ( ! found ) {
		slide.answers.push( { caption: newAnswerCaption, correct: isCorrect } );
		$newAnswer = $( '<div class="answer hvr-float-shadow"/>' )
			.text( newAnswerCaption )
			.draggable( settings.slideAnswerDraggableOpts );
		$( "#" + slideId )
			.find( ".answer-list" )
			.append( $newAnswer );
	}
	// update EDIT DOM
	$( '#' + slideId )
		.find( ".answer-list .answer" )
		.removeClass( "answer-correct" )
		.addClass( "answer-incorrect" );
	// TODO use filter not find (exact match)
	$( '#' + slideId )
		.find( ".answer-list .answer:contains(" + correctAnswer + ")" )
		.removeClass( "answer-incorrect" )
		.addClass( "answer-correct" );

	// update the data
	gamedata.slides[ slideId ] = slide;
	game.invalidate();
	return true;
}

// remove an answer matching the caption from the slide
game.removeAnswerFromSlide = function( slideId, answerCaption ) {
	var slide = gamedata.slides[ slideId ];
	if ( ( ! slide ) ) {
		return false;
	}

	// simple copy and replace
	answers = [];
	var found = false;
	for ( var i = 0; i < slide.answers.length; i++ ) {
		var answer = slide.answers[ i ];
		if ( answer.caption && ( answer.caption == answerCaption ) ) {
			found = true;
		} else {
			answers.push( answer );
		}
	}
	if ( ! found ) {
		return false;
	}
	// update EDIT DOM // TODO use filter not find
	$( '#' + slideId )
		.find( ".answer-list .answer:contains(" + answerCaption + ")" )
		.remove();

	// update the data
	slide.answers = answers;
	gamedata.slides[ slideId ] = slide;
	game.invalidate();
	return true;
}

// add a new answer to the master list
game.addNewAnswer = function( answer ) {
	$newAnswer = $( '<div class="answer hvr-float-shadow" />' )
		.text( answer )
		.draggable( settings.answerSourceDraggableOpts );
	$( "#add-answer" )
		.after( $newAnswer );
}

// update all answers matching the old text to the new text
game.updateAnswerText = function( newAnswer, oldAnswer ) {
	// update the game data
	for ( var slideId in gamedata.slides ) {
		var slide = gamedata.slides[ slideId ];
		if ( ! slide.answers ) {
			continue;
		}
		for ( var i = 0; i < slide.answers.length; i++ ) {
			var answer = slide.answers[ i ];
			if ( answer.caption && ( answer.caption == oldAnswer ) ) {
				gamedata.slides[ slideId ].answers[ i ].caption = newAnswer;
			}
		}
	}
	// update the DOM
	$( ".answer" ).filter( function( ) {
		return $( this ).text() === oldAnswer;
	}).text( newAnswer );
	game.invalidate();
}

// USER
var user = {};

user.init = function() {
	var savedprefs = localStorage.getItem( 'game-editor-prefs' );
	var userPrefs = {
		env: 'dev',
		currentTab: '#player',
	}

	if ( typeof savedprefs == 'string' ) {
		try {
			userPrefs = JSON.parse( savedprefs );
		} catch ( e ) {
		}
	}
	if ( userPrefs.env && settings.targets[ userPrefs.env ] ) {
		// TODO decide if this should be saved or not
		previewurl = settings.targets[ 'dev' ].preview;
	}
	user.settings = userPrefs;
}
user.setEnv = function( newEnv ) {
	user.settings.env = newEnv;
	if ( settings.targets[ newEnv ] ) {
		previewurl = settings.targets[ newEnv ].preview;
	}
	user.invalidate();
}
user.setTab = function( tab ) {
	user.settings.currentTab = tab;
	user.invalidate();
}
user.getTab = function() {
	return user.settings.currentTab;
}
user.invalidate = function() {
	localStorage.setItem( 'game-editor-prefs', JSON.stringify( user.settings ) );
	$( document ).trigger( 'user:changed' );
}
user.getEnv = function() {
	return user.settings.env;
}

// see https://gist.github.com/afriggeri/1266756
var haiku = function() {
  var adjs = [
    "autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark",
    "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter",
    "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue",
    "billowing", "broken", "cold", "damp", "falling", "frosty", "green",
    "long", "late", "lingering", "bold", "little", "morning", "muddy", "old",
    "red", "rough", "still", "small", "sparkling", "throbbing", "shy",
    "wandering", "withered", "wild", "black", "young", "holy", "solitary",
    "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine",
    "polished", "ancient", "purple", "lively", "nameless"
  ];
  var nouns = [
    "waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning",
    "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter",
    "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook",
    "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly",
    "feather", "grass", "haze", "mountain", "night", "pond", "darkness",
    "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder",
    "violet", "water", "wildflower", "wave", "water", "resonance", "sun",
    "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper",
    "frog", "smoke", "star"
  ];
  var rnd = Math.floor(Math.random()*Math.pow(2,12));
  return adjs[ rnd>>6%64 ] + "_" + nouns[ rnd%64 ] + "_" + rnd;
}

var confirmDialog = function( heading, question, cancelButtonTxt, okButtonTxt, callback, gameId ) {
	var confirmModal =
		$( '<div class="modal fade">' +
		'<div class="modal-dialog">' +
		'<div class="modal-content">' +
		'<div class="modal-header">' +
		'<a class="close" data-dismiss="modal" >&times;</a>' +
		'<h3>' + heading +'</h3>' +
		'</div>' +

		'<div class="modal-body">' +
		'<p>' + question + '</p>' +
		'</div>' +

		'<div class="modal-footer">' +
		'<a href="#!" class="btn btn-warning" data-dismiss="modal">' +
		cancelButtonTxt +
		'</a>' +
		'<a href="#!" id="okButton" class="btn btn-primary">' +
		okButtonTxt +
		'</a>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>'
		);

	confirmModal.find( '#okButton' ).click( function( event ) {
		confirmModal.modal( 'hide' );
		callback( gameId );
	});

	confirmModal.modal( 'show' );
};

