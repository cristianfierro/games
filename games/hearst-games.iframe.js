if ( typeof gameDeliveryDomain == 'undefined' ) {
	var gameDeliveryDomain = 'http://cos.h-cdn.co/games';
}
var gameEventName = "game:puzzle";

var siteConfigs = {
	'cosmopolitan.com': {
		fb: '162305873819997',
		twitter: 'Cosmopolitan',
		color1: "#ec008d",
		bodyClass: "cosmopolitan"
	},
	'hdmtech.net': {
		fb: '0',
		twitter: 'Hearst',
		color1: "#e2e2e2",
		bodyClass: "default"
	}
}



/*
require.config({
	paths: {
		// See https://greensock.com/gsap
		'gsaptweenmax': gameDeliveryDomain + '/js/TweenMax.min',
		'gsapdraggable': gameDeliveryDomain + '/js/Draggable.min'
//		'gsaptweenmax': '//cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min',
//		'gsapdraggable': '//cdnjs.cloudflare.com/ajax/libs/gsap/latest/utils/Draggable.min'
	}
});
*/

var HRSTGAME = {
	logDestination: "console", //eventually change to "Omniture"
	containername: ".draganddrop-test-1",
	cdnPath: 'http://rtheriault-test.s3-website-us-east-1.amazonaws.com',
	//cdnPath: 'http://games-dev.hdmtech.net',
	hipsPath: 'http://games-hips-dev.hdmtech.net/games-dev',
	useHips: false, // feature flag
	// TODO allow override
	cssFile: '/dist/games-iframe.css',
	recircFile: '/recirc.json',
	// TODO build template based on game type
	template: '/dd-6-template.html',
	// default type is rearrange
	gametype: 'rearrange',
	title: 'Puzzle game', // placeholder, see init() $(".article-title").html();
	dek: '',
	cache: {}, // hackishly getting former globalVars out of global scope
	dim: {}, // Dimensions list

	// save time loading maybe
	templateHtml: ' ' +
'	<div id="gametest" class="tempwrapper cosmofont modalactive">' +
'		<div class="gamenav">' +
'			<div class="dd-winstate">' +
'				<div class="dd-banner-success">Success! You solved the puzzle.</div>' +
'				<div class="dd-banner-summary">' +
'					<span class="dd-stopwatch-holder">' +
'						<span class="dd-text">Your time:</span>' +
'						<span class="dd-stopwatch-display" id="finaltime">00:00:00</span>' +
'					</span>' +
'					<span class="dd-social-holder">' +
'						<span class="dd-text">Challenge a friend:</span>' +
'						<div class="share-container"><ul class="dd-share-module--buttons"><li class="dd-share-module--button-wrap dd-share-module--button-wrap-facebook"><div class="dd-share-button dd-share-button--facebook"><a class="dd-share-button--link dd-share-button--open-window dd-link" target="_blank"><i class="dd-share-button--icon dd-icon dd-icon-facebook dd-link-icon"></i><span class="dd-share-button--text link-txt">Share on Facebook</span></a></div></li><li class="dd-share-module--button-wrap dd-share-module--button-wrap-twitter"><div class="dd-share-button dd-share-button--twitter"><a href="" class="dd-share-button--link dd-share-button--open-window dd-link" target="_blank"><i class="dd-share-button--icon dd-icon dd-icon-twitter dd-link-icon"></i><span class="dd-share-button--text link-txt">Share on Twitter</span></a></div></li><li class="dd-share-module--button-wrap dd-share-module--button-wrap-whatsapp"><div class="dd-share-button dd-share-button--whatsapp"><a class="dd-share-button--link dd-share-button--open-window dd-link" target="_blank"><i class="dd-share-button--icon dd-icon dd-icon-whatsapp dd-link-icon"></i><span class="dd-share-button--text link-txt">Share on WhatsApp</span></a></div></li></ul></div>' +
'					</span>' +
'				</div>' +
'			</div>' +
'			<div class="dd-playstate">' +
'				<span class="dd-score-holder"><span id="dd-score">0</span> of 6 Correct</span>' +
'				<span id="stopwatch">00:00:00</span>' +
'			</div>' +
'		</div>' +
'		<div id="list">' +
'			<div id="gamemodal">' +
'				<div class="gamemodalcontent initial">' +
'					<span class="bigbutton" id="start"></span>' +
'				</div>' +
'				<div id="gamemodalbg"></div>' +
'			</div>' +
'			<div id="blocker"></div>' +
'		</div>' +
'		<div class="recirc-wrapper"></div>' +
'	</div>',
	// end crazy block of html

	init: function() {
		return this;
	},

	debug: function ( message ) {
		if ( console && ( 'console' == HRSTGAME.logDestination ) ) {
			console.log( message );
		}
	},

	// load the game, eventually we may give this optional id param
	gameLoad: function () {

		this.debug('gameLoad');
		// override cdnPath
		if ( typeof gameDeliveryDomain != 'undefined' ) {
			this.cdnPath = gameDeliveryDomain;
			if ( typeof gameContainerClass != 'undefined' ) {
				this.containername = '.' + gameContainerClass;
			}
		}
		this.siteconfig = siteConfigs[ "hdmtech.net" ];
		if ( hearstSite && siteConfigs[ hearstSite ] ) {
			this.siteconfig = siteConfigs[ hearstSite ];
			$( 'body' ).addClass( this.siteconfig.bodyClass );
		}

		// set the container and dimensions
		this.$container = $( this.containername );
		if ( ! this.$container.length ) {
			this.debug( 'oops, could not find element ' + this.containername );
			return;
		}

		this.dim.containerwidth = this.$container.width();
		//var tilewidth = (containerwidth/3) - 14;
		// TODO assumes 3 columns
		this.dim.tilewidth = ( this.dim.containerwidth / 3 ) - 14;
		this.dim.tileheight = this.dim.tilewidth * 0.8;
		this.dim.rowSize = this.dim.tileheight;
		this.dim.colSize = this.dim.tilewidth; //should be around 110 for mobile
		this.dim.startWidth  = "100%";
		this.dim.startSize = this.dim.colSize;
		this.dim.singleWidth = this.dim.colSize * 3;

		// set the title
		this.title = $(".article-title").html();

		this.gameId = hearstGameId || this.$container.data('game-id');
		if ( !this.gameId ) {
			this.debug('no game id' );
			return false;
		}

		// TODO based on game type
		/*
		var templateUrl = this.cdnPath + this.template;
		this.debug( 'Loading template ' + templateUrl );
		$.get( templateUrl, function( data ) {
			HRSTGAME.templateHtml = data;
		});
		*/

		var recircUrl = this.cdnPath + this.recircFile;
		this.debug( 'Loading recirc ' + recircUrl );
		$.getJSON( recircUrl, function( data ) {
			HRSTGAME.recirc = data;
		});
		var dataUrl = this.cdnPath + '/data/' + this.gameId + '.json';
		this.debug( 'loading game ' + this.gameId + ' from ' + dataUrl );
		$.getJSON( dataUrl, function( data ) {
			HRSTGAME.gameData = data;
			if ( HRSTGAME.gameData.gametype ) {
				HRSTGAME.gametype = HRSTGAME.gameData.gametype;
				HRSTGAME.debug( 'Game is of type ' + HRSTGAME.gametype );
			}
			if ( data.challenge ) {
				HRSTGAME.title = data.challenge;
			}
			// we might load a type library before proceeding
			setTimeout( HRSTGAME.waitForAssets, 50 );
		});
	},

	// insert CSS in the head
	// params is a hash containing the id and link
	addCss: function ( params ) {
		var cssId = params.id;
		if ( ! document.getElementById( cssId ) ) {
			var head  = document.getElementsByTagName( 'head' )[ 0 ];
			var link  = document.createElement( 'link' );
			link.id   = cssId;
			link.rel  = 'stylesheet';
			link.type = 'text/css';
			link.href = params.link;
			link.media = 'all';
			head.appendChild( link );
		}
	},

	waitForAssets: function() {
		if ( ( ! HRSTGAME.recirc ) || ( ! HRSTGAME.templateHtml ) ) {
			HRSTGAME.debug( 'waiting for game setup' );
			setTimeout( HRSTGAME.waitForAssets, 200 );
			return;
		}
		HRSTGAME.debug( 'assets are ready...' );
		HRSTGAME.gameBegin();
	},

	gameBegin: function () {
		// track succesful initialization
		this.track( 'loaded ' + HRSTGAME.gameId );

		var gameData = this.gameData;
		this.debug( 'Started game' );

		// bit hokey but we're mapping the new to old structure
		var tiles = gameData.tiles || [];
		if ( tiles.length < 1 ) {
			var isURL = new RegExp('^(?:[a-z]+:)?//', 'i');
			for ( var key in gameData.slides ) {
				var imageData = gameData.slides[ key ];
				var imageurl = imageData.url;
				if ( ! isURL.test( imageurl ) ) {
					if ( HRSTGAME.useHips ) {
						imageurl = HRSTGAME.hipsPath + imageurl;
						// todo add crop params
					} else if ( imageData.crop && imageData.crop.url ) {
						imageurl = imageData.crop.url;
					}
				}
				tiles.push( {
					image: imageurl,
					caption: imageData.caption
					} );
			}
		}
		//We're not taking the title from the JSON anymore - we're just scooping up the article's headline (above)
		//title = gameData.title;
		this.dek = gameData.dek;

		var tilesClone = this.clone( tiles );
		this.cache.tilesShuffled = this.shuffle( tilesClone );
		this.cache.tiles = tiles;
		//todo: make sure the shuffled array is actually different

		// add the css if it's not already in the page
		// this.addCss( { id: 'dd-css', link: this.cdnPath + this.cssFile } );

		this.buildHtml();
		setupTiles();
	},

	buildHtml: function() {
		this.$container.append( this.templateHtml );
		this.setupRecirc( this.recirc );
	},

	setupRecirc: function( recirc ) {
		var maxRecirc = 4;
		recirc = this.shuffle( recirc );
		var gametype = this.gametype;
		var html = '<div class="module module-story-list recirc-standard-primary"><div id="trc_header_94630" class="trc_rbox_header trc_rbox_border_elm"><div class="trc_header_ext"></div><span class="trc_rbox_header_span">More Puzzles</span></div><div class="module-story-list--stories">';
		var inserted = 0;
		var isURL = new RegExp('^(?:[a-z]+:)?//', 'i');
		// collect items so we can prioritize by type
		var items = [[],[]];
		for ( var i = 0, len = recirc.length; i < len; i++ ) {
			var item = recirc[i];
			var itemhtml = '';
			var prio = ( item.gametype == gametype ) ? 0 : 1;
			if ( item.game == this.gameId ) {
				continue;
			}
			// images may be absolute or if relativem we assume they are hosted in CDN
			// recirc links should always be relative to the current site
			var itemimage = item.image;
			if ( ! isURL.test( itemimage ) ) {
				itemimage = HRSTGAME.cdnPath + itemimage;
			}
			itemhtml += '<div class="module-story">';
			itemhtml += '<a href="' + item.link + '" class="module-story--link game-recirc-link game-recirc-game-' + item.game + ' link" title=""><div class="module-story--image"><div class="module-story--image-inner">';
			itemhtml += '<img src="' + itemimage + '" nopin="nopin"></div></div>';
			itemhtml += '<div class="module-story--inner"><div class="module-story--text"><span class="module-story--title link-txt">' + item.headline + '</span></div></div></a>';
			itemhtml += '</a></div></a>';
			items[ prio ].push( itemhtml );
		}
		// assemble the list with the current type first
		var finalItems = items[0].concat(items[1]);
		html += finalItems.slice(0,4).join('');
		html += '</div></div>';
		this.$container.find( '.recirc-wrapper' ).append( html );
	},

	attachSocialText: function( time ) {
		var url = window.location.href;
		// share with the parent url
		// TODO get app id and twitter handle from iFrame settings
		if ( parent !== window ) {
			url = document.referrer;
		}
		var shareString = "I solved the puzzle in " + time + "! " + HRSTGAME.title + ": " + url;
		var shareText = "I solved the puzzle in "+time+"!";
		var shareStringUrlEncoded = encodeURI(shareString);
		var shareTextUrlEncoded = encodeURI(shareText);
		var titleUrlEncoded = encodeURI( HRSTGAME.title );
		var urlUrlEncoded = encodeURI(url);
		$(".dd-share-button--twitter .dd-share-button--link")
			.attr("href", "//www.twitter.com/share?url="+url+"&text="+shareTextUrlEncoded+" "+ HRSTGAME.title +"&via=" + HRSTGAME.siteconfig.twitter )
			.attr( 'data-share-type','twitter' );
		$(".dd-share-button--facebook .dd-share-button--link")
			.attr("href", "https://www.facebook.com/sharer/sharer.php?app_id=" + HRSTGAME.siteconfig.fb + "&sdk=joey&u="+urlUrlEncoded+"&display=popup&ref=plugin&src=share_button")
			.attr( 'data-share-type', 'facebook' );
		$(".dd-share-button--whatsapp .dd-share-button--link").attr("href", "whatsapp://send?text="+shareString+"").attr( 'data-share-type', 'whatsapp' );
		$(".dd-share-button--whatsapp .dd-share-button--link").attr("data-action", "share/whatsapp/share");

		// report any share link click
		$(".dd-share-button--link").on( 'click', function( event ) {
			HRSTGAME.track( 'share ' + $( this ).data('share-type') );
		});

	},

	track: function( mesg ) {
		$( window ).trigger( gameEventName, [ mesg ] );
	},

	clone: function( obj ) {
		if (null == obj || "object" != typeof obj)
			return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if ( obj.hasOwnProperty(attr) )
				copy[attr] = obj[attr];
		}
		return copy;
	},

	shuffle: function ( sourceArray ) {
		for (var i = 0; i < sourceArray.length - 1; i++) {
			var j = i + Math.floor(Math.random() * (sourceArray.length - i));

			var temp = sourceArray[j];
			sourceArray[j] = sourceArray[i];
			sourceArray[i] = temp;
		}
		return sourceArray;
	},

	calculateWidths: function () {
		containerwidth = this.$container.width();
		//var tilewidth = (containerwidth/3) - 14;
		//tilewidth = (containerwidth/3) - 14;
		tilewidth = (containerwidth/3) - 0;
		tileheight = tilewidth*.8;

		rowSize   = tileheight;
		colSize   = tilewidth; //should be around 110 for mobile

		startWidth  = "100%";
		startSize   = colSize;
		singleWidth = colSize * 3;

	}


}.init();




function setupTiles() {

	HRSTGAME.calculateWidths();

	//console.log(globals.tiles);

	// GRID OPTIONS

	//var gutter    = 14;     // Spacing between tiles
	var numMoves = 0;
	var gutter    = 0;     // Spacing between tiles
	var numTiles  = HRSTGAME.cache.tiles.length;    // Number of tiles to initially populate the grid with
	var fixedSize = true; // When true, each tile's colspan will be fixed to 1
	var oneColumn = false; // When true, grid will only have 1 column and tiles have fixed colspan of 1
	var threshold = "50%"; // This is amount of overlap between tiles needed to detect a collision

	var $add  = $("#add");
	var $list = $("#list");
	var $mode = $("input[name='layout']");


	// Live node list of tiles
	var tiles  = $list[0].getElementsByClassName("tile");
	var label  = 1;
	var zIndex = 1000;

	var colCount   = null;
	var rowCount   = null;
	var gutterStep = null;

	//var shadow1 = "0 1px 3px  0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.6)";
	//var shadow2 = "0 6px 10px 0 rgba(0, 0, 0, 0.3), 0 2px 2px 0 rgba(0, 0, 0, 0.2)";

	var shadow1 = "none";
	var shadow2 = "0 6px 10px 0 rgba(0, 0, 0, 0.3), 0 2px 2px 0 rgba(0, 0, 0, 0.2)";


	$( window ).resize(resize);
	$add.click(createTile);
	$mode.change(init);

	init();

	/* jjjs */

	$("#answers").hide();
	$(".gamenav").hide();
	$(".dd-winstate").hide();
	$("#blocker").hide();
	$(".win").hide();
	$(".recirc-wrapper").hide();
	$('#start').text("Start the Puzzle!").hide();

	$("#start").click(function() {
		//$( "#gamemodal" ).fadeOut();
		$("#gamemodal").fadeOut(500, function(){
			$('.initial').hide(); });
		$(".gamenav").slideDown();
		$(".tempwrapper").toggleClass('modalactive');
		timer();
		HRSTGAME.track('start button');
	});

	$(".module-story").click(function() {
		var destination = $(this).find('a').attr('href');
		HRSTGAME.track("recirc click: "+destination);
	});

	// after a delay, expose the Start button - avoids showing it before it's styled
	setTimeout(function(){
		$("#start").show();
	}, 100);

	function recalulateAndMoveTiles() {

		HRSTGAME.calculateWidths();

		$(".tile").each(function() {
			//alert('hi');
			var tile = this.tile;
			//console.log(tile);
			console.log('moving tiles');
			TweenLite.to(tile.element, 0.2, { width : tilewidth, height : tileheight });
			TweenLite.to(tile.element, 0.2, { x : tile.x, y : tile.y });
		});
	}


	function checkOrder(returnScoreFlag) {
		//basically, just compare the image backgrounds of the tiles against the initial $tiles php array
		var guesses = [];
		$( ".tile" ).each(function( index ) {
			var bg = $(this).css('background-image');
			var file = bg.substr(bg.lastIndexOf('/') + 1);
			file = file.replace("\")", "");
			file = file.replace(/\(|\)/g,''); //remove parens (safari only bug)
			guesses.push(file);
		});
		//console.log(guesses);

		//var answers = ["lorde.jpg", "ts.jpeg", "cm.png", "diddy.jpg", "sc.jpg", "wn.jpg"];
		var answers = [];
		for (var i=0;i<HRSTGAME.cache.tiles.length;i++) {
			var bg = HRSTGAME.cache.tiles[i].image;
			var file = bg.substr(bg.lastIndexOf('/') + 1);
			file = file.replace("\")", "");
			file = file.replace(/\(|\)/g,''); //remove parens (safari only bug)
			//console.log(image);
			answers.push(file);
		}
		//console.log(answers);

		var score = 0;
		for (var i=0;i<guesses.length;i++) {
			if (guesses[i] == answers[i]) {
				score++;
			}
		}
		//console.log("score is "+score);

		var guessesString = guesses.toString();
		var answersString = answers.toString();
		//alert(guessesString);
		//alert(answersString);
		if (returnScoreFlag) {
			return score;
		} else {
			if (guessesString == answersString) {
				//alert('yes');
				return true;
			} else {
				//alert('no');

				//return true;
				return false;
			}
		}
	}



	// Timer code: http://jsfiddle.net/oukjfavu/
	var h1 = document.getElementById('stopwatch'),
		start = document.getElementById('startme'),
		stop = document.getElementById('stop'),
		seconds = 0, minutes = 0, hours = 0,
		t;

	function add() {
		seconds++;
		if (seconds >= 60) {
			seconds = 0;
			minutes++;
			if (minutes >= 60) {
				minutes = 0;
				hours++;
			}
		}

		h1.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);

		timer();
	}
	function timer() {
		t = setTimeout(add, 1000);
	}




	// ========================================================================
	//  INIT
	// ========================================================================
	function init() {

		var width = startWidth;

		// This value is defined when this function
		// is fired by a radio button change event
		switch (this.value) {

		case "mixed":
			fixedSize = false;
			oneColumn = false;
			colSize   = startSize;
			break;

		case "fixed":
			fixedSize = true;
			oneColumn = false;
			colSize   = startSize;
			break;

		case "column":
			fixedSize = false;
			oneColumn = true;
			width     = singleWidth;
			colSize   = singleWidth;
			break;
		}

		$(".tile").remove();

		TweenLite.to($list, 0.2, { width: width });
		TweenLite.delayedCall(0.25, populateBoard);

		function populateBoard() {

			label = 1;
			resize();

			for (var i = 0; i < numTiles; i++) {
				createTile(i);
			}
		}
	}


	// ========================================================================
	//  RESIZE
	// ========================================================================
	function resize() {
		recalulateAndMoveTiles();
		//console.log('resize() ');
		//colCount   = oneColumn ? 1 : Math.floor($list.outerWidth() / (colSize + gutter));
		colCount  = oneColumn ? 1 : Math.floor($list.width() / (colSize + gutter));
		//console.log('colCount is '+colCount);
		gutterStep = colCount == 1 ? gutter : (gutter * (colCount - 1) / colCount);
		//console.log(gutterStep);
		rowCount   = 0;
		//HRSTGAME.calculateWidths();

		layoutInvalidated();
		recalulateAndMoveTiles();
	}



	// ========================================================================
	//  CHANGE POSITION
	// ========================================================================
	function changePosition(from, to, rowToUpdate) {

		//console.log('changePosition');
		var $tiles = $(".tile");
		//var insert = from > to ? "insertBefore" : "insertAfter";
		var insert;
		if (from > to) {
			insert = "insertBefore";
		} else {
			insert = "insertAfter";
		}

		// Change DOM positions
		$tiles.eq(from)[insert]($tiles.eq(to));

		layoutInvalidated(rowToUpdate);
	}


	// ========================================================================
	//  CREATE TILE
	// ========================================================================
	function createTile(i) {
		//console.log('createTile() ');
		//var colspan = fixedSize || oneColumn ? 1 : Math.floor(Math.random() * 2) + 1;
		var colspan = 0;
		if (fixedSize) {
			colspan = fixedSize;
		} else {
			if (oneColumn) {
				colspan = 1;
			} else {
				colspan = Math.floor(Math.random() * 2) + 1;
			}
		}

		//see if the element has a caption, and add it
		var caption = "";
		var theTile = HRSTGAME.cache.tilesShuffled[i];
		if ( theTile.caption ) {
			//caption = HRSTGAME.cache.tiles[i].caption;
			caption = "<span class=\"dd-caption\">" + theTile.caption + "</span>";
		}

		var elementImageURL = theTile.image;
		var element = $("<div></div>")
			.addClass("tile tile"+label+"")
			.html(caption)
			.css({"background-image":'url(' + elementImageURL + ')'});
		//element = element.addClass('helllloooo');
		label++;
		var lastX   = 0;

		Draggable.create(element, {
			onDrag: onDrag,
			onPress: onPress,
			onRelease: onRelease,
			zIndexBoost : false
		});

		// NOTE: Leave rowspan set to 1 because this demo
		// doesn't calculate different row heights
		var tile = {
			col: null,
			colspan: colspan,
			element: element,
			height: 0,
			inBounds: true,
			index: null,
			isDragging : false,
			lastIndex: null,
			newTile: true,
			positioned : false,
			row: null,
			rowspan: 1,
			width: 0,
			x: 0,
			y: 0
		};

		// Add tile properties to our element for quick lookup
		element[0].tile = tile;

		$list.append(element);
		layoutInvalidated();

		function onPress() {

			lastX = this.x;
			tile.isDragging = true;
			tile.lastIndex = tile.index;

			TweenLite.to(element, 0.2, {
				autoAlpha : 0.75,
				boxShadow : shadow2,
				scale     : 0.95,
				zIndex    : "+=1000"
			});
		}

		function onDrag() {

			// Move to end of list if not in bounds
			if (!this.hitTest($list, 0)) {
				tile.inBounds = false;
				changePosition(tile.index, tiles.length - 1);
				return;
			}

			tile.inBounds = true;

			for (var i = 0; i < tiles.length; i++) {

				// Row to update is used for a partial layout update
				// Shift left/right checks if the tile is being dragged
				// towards the the tile it is testing
				var testTile    = tiles[i].tile;
				var onSameRow   = (tile.row === testTile.row);
				var rowToUpdate = onSameRow ? tile.row : -1;
				var shiftLeft   = onSameRow ? (this.x < lastX && tile.index > i) : true;
				var shiftRight  = onSameRow ? (this.x > lastX && tile.index < i) : true;
				var validMove   = (testTile.positioned && (shiftLeft || shiftRight));

				if (this.hitTest(tiles[i], threshold) && validMove) {
					changePosition(tile.index, i, rowToUpdate);
					break;
				}
			}

			lastX = this.x;
		}

		function onRelease() {

			// Move tile back to last position if released out of bounds
			this.hitTest($list, 0) ? layoutInvalidated() : changePosition(tile.index, tile.lastIndex);

			TweenLite.to(element, 0.2, {
				autoAlpha : 1,
				boxShadow: shadow1,
				scale     : 1,
				x         : tile.x,
				y         : tile.y,
				zIndex    : ++zIndex,
				onComplete: function(){ // TODO replace this with a callback
					//console.log('check scores!');

					numMoves++;
					var score = checkOrder(true);
					//alert("score is "+score);
					//console.log(score);
					$("#dd-score").html(score);
					$(".dd-score-holder").addClass('test');
					//$(".tile1").hide();

					HRSTGAME.track( "move" + numMoves );
					if (checkOrder()) {
						//alert('you win!');

						//pause timer
						clearTimeout(t);
						$("#blocker").show();
						//$("#list").addClass('winner');
						HRSTGAME.$container.addClass('winner');
						//$("#guess").hide();
						$("#instructions").hide();

						$(".sorry").hide();
						$( ".win" ).show();

						var finaltime = $("#stopwatch").html();
						$("#finaltime").html(finaltime);

						// set Social text, removing leading zeros etc
						HRSTGAME.attachSocialText( finaltime.replace( /^0*:?0?/, '' ) );
						$(".dd-playstate").slideUp(500);
						$(".dd-winstate").slideDown(500);

						HRSTGAME.track( "solved" + numMoves );
						HRSTGAME.track( "solved" );
						HRSTGAME.track( "time " + finaltime );
					}
				}
			});

			tile.isDragging = false;
		}

	}

	// ========================================================================
	//  LAYOUT INVALIDATED
	// ========================================================================
	function layoutInvalidated(rowToUpdate) {
		//console.log('layoutInvalidated();');
		var timeline = new TimelineMax();
		var partialLayout = (rowToUpdate > -1);

		var height = 0;
		var col    = 0;
		var row    = 0;
		var time   = 0.35;

		$(".tile").each(function(index, element) {

			var tile    = this.tile;
			var oldRow  = tile.row;
			var oldCol  = tile.col;
			var newTile = tile.newTile;

			// PARTIAL LAYOUT: This condition can only occur while a tile is being
			// dragged. The purpose of this is to only swap positions within a row,
			// which will prevent a tile from jumping to another row if a space
			// is available. Without this, a large tile in column 0 may appear
			// to be stuck if hit by a smaller tile, and if there is space in the
			// row above for the smaller tile. When the user stops dragging the
			// tile, a full layout update will happen, allowing tiles to move to
			// available spaces in rows above them.
			if (partialLayout) {
				//console.log('partialLayout');
				row = tile.row;
				if (tile.row !== rowToUpdate) return;
			}

			// Update trackers when colCount is exceeded
			if (col + tile.colspan > colCount) {
				col = 0; row++;
			}

			//HRSTGAME.calculateWidths();
			//console.log(tile);

			$.extend(tile, {
				col    : col,
				row    : row,
				index  : index,
				x      : col * gutterStep + (col * colSize),
				y      : row * gutterStep + (row * rowSize),
				width  : tile.colspan * colSize + ((tile.colspan - 1) * gutterStep),
				height : tile.rowspan * rowSize
			});

			col += tile.colspan;

			// If the tile being dragged is in bounds, set a new
			// last index in case it goes out of bounds
			if (tile.isDragging && tile.inBounds) {
				tile.lastIndex = index;
			}

			if (newTile) {
				//console.log('newTile');
				// Clear the new tile flag
				tile.newTile = false;

				var from = {
					autoAlpha : 0,
					boxShadow : shadow1,
					height    : tile.height,
					scale     : 0,
					width     : tile.width
				};

				var to = {
					autoAlpha : 1,
					scale     : 1,
					zIndex    : zIndex
				}

				timeline.fromTo(element, time, from, to, "reflow");
			}

			// Don't animate the tile that is being dragged and
			// only animate the tiles that have changes
			if (!tile.isDragging && (oldRow !== tile.row || oldCol !== tile.col)) {
				//console.log('only animate tiles that have changes');
				var duration = newTile ? 0 : time;

				// Boost the z-index for tiles that will travel over
				// another tile due to a row change
				if (oldRow !== tile.row) {
					timeline.set(element, { zIndex: ++zIndex }, "reflow");
				}

				timeline.to(element, duration, {
					x : tile.x,
					y : tile.y,
					onComplete : function() { tile.positioned = true; },
					onStart    : function() { tile.positioned = false; }
				}, "reflow");
			}
		});

		// If the row count has changed, change the height of the container
		if (row !== rowCount) {
			//console.log('change height of container');
			rowCount = row;
			height   = rowCount * gutterStep + (++row * rowSize);
			timeline.to($list, 0.2, { height: height }, "reflow");
		}
	}

} // end function setupTiles

console.log('game file loaded');

//require( [ 'gsaptweenmax', 'gsapdraggable' ], function( gsaptweenmax, gsapdraggable ) {
//});

$( document ).ready( function() {
	// disable marketplace
	HRST.ab = HRST.ab || {}; HRST.ab.disableMediaNet = true;
	// start it up!
	HRSTGAME.gameLoad();

	console.log('hooking up listener');
	// log the tracking messages if debug is active
	$( window ).on( gameEventName, function( event, message ) {
		HRSTGAME.debug( '---track: ' + message );

		// JUST TESTING - this should be moved
		if ( typeof mobileAnalyticsClient == "object" ) {
			var sw = $('#stopwatch').html() || 'stopped';
			console.log( 'adding ma event ' + sw );
			mobileAnalyticsClient.recordEvent( 'rearrange activity', {
				'user_action': message,
				'timer': sw
				}, {
				});
		}
	});
});


