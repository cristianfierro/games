// refactored pixels.js with different JSON format
// global for "sharing"
var HRSTGAME = HRSTGAME || {};
HRSTGAME.gameid = hearstGameId;
HRSTGAME.gametype = "unscramble";
HRSTGAME.parentUrl = "unknown";
if ( parent != window ) {
	HRSTGAME.parentUrl = document.referrer;
}

var siteConfigs = {
	'cosmopolitan.com': {
		fb: '162305873819997',
		twitter: 'Cosmopolitan',
		color1: "#ec008d",
		bodyClass: "cosmopolitan"
	},
	'esquire.com': {
		fb: '171874009543995',
		twitter: 'Esquire',
		color1: "#333333",
		bodyClass: "esquire"
	},
	'elle.com': {
		fb: '364664413547847',
		twitter: 'ELLEmagazine',
		color1: "#333333",
		bodyClass: "elle"
	},
	'hdmtech.net': {
		fb: '0',
		twitter: 'Hearst',
		color1: "#e2e2e2",
		bodyClass: "default"
	},
	'localhost:8888': {
		fb: '0',
		twitter: 'solomania',
		color1: "#e2e2e2",
		bodyClass: "default"
	},

}


$( document ).ready(function() {

	var G = {};
	$container = $("#container");

	function gameLoad( ) {
		$.getJSON( dataUrl, function( data ) {
			gameBegin( data );
			//G.data = data;
		});
	}

	gameLoad();

	function gameBegin( gameData ) {
		//console.log(gameData);
		//console.log(gameData.slides.image1.url);
		G.image = gameData.slides.image1.url;

		if (gameData.challenge) {
			G.challenge = gameData.challenge;
		} else {
			G.challenge = ""; //leave this blank - won't show the challenge in social share
		}

		if (gameData.settings.complexity == "easy") {
			G.cols = 3;
			G.rows = 2;
		} else if (gameData.settings.complexity == "hard") {
			G.cols = 5;
			G.rows = 3;
		}


		G.slides = [];
		for ( var i in gameData.images ) {
			G.slides.push( gameData.images[ i ] );
		}

		G.siteconfig = siteConfigs[ "hdmtech.net" ];

		if ( hearstSite && siteConfigs[ hearstSite ] ) {
			G.siteconfig = siteConfigs[ hearstSite ];
			$( 'body' ).addClass( G.siteconfig.bodyClass );
		}

		G.stepsPerSecond = 5;
		G.nextSlideDuration = 2000;
		G.successFadeOutDelay = 800;
		G.numMoves = 0;

		//G.slideDuration = gameData.settings.slideduration || 20;
		G.randomizeOrder = gameData.randomizeOrder;
		G.headline = gameData.challenge;
		G.okToGuess = true;
		G.wrongAnswers = 0;
		G.totalMatches = 0;
		G.currentSlide = 0;
		G.totalPoints = 100;
		G.pointsSoFar = 0;
		G.pointsSoFarForDisplay = 0;
		G.pointsPerSlide = G.totalPoints / G.slides.length;
		var containerWidth = $("#container").width();
		//containerWidth = containerWidth*.5;

		G.swapTime = .15;
		//G.swapTime = 3;
		G.returnHomeTime = .5;
		G.swapHappening = false;

		if ( G.randomizeOrder == true) {
			//clone and shuffle
			var clone = G.slides.slice(0);
			shuffle(clone);
			G.slidesRandom = clone;
			G.slides = G.slidesRandom;
		}


		/* Start */

		preloadImages();

		loadFirstPuzzle();

		function preloadImages(){
			for (var i=0;i<G.slides.length;i++) {
				var imageObject = new Image();
        		imageObject.src = G.slides[i].image;
			}
		}

		function loadHeader() {
			$("#container").append('<div id="header"></div>');
			$("#header").addClass("hide"); //hide on initial load, so it can slide down when you press the start button
			//$("#header").append('<span class="progress">1 of 8</span>');
			//$("#header").append('<span class="pause" id="pause">Pause</span>');
			$("#header").append('<span class="score">00:00</span>');

			var winstate = '<div class="dd-winstate"><div class="dd-banner-success">Success! You solved the puzzle.</div><div class="dd-banner-summary"><span class="dd-stopwatch-holder"><span class="dd-text">Your time:</span><span class="dd-stopwatch-display" id="finaltime">00:00:00</span></span><span class="dd-social-holder"><span class="dd-text">Challenge a friend:</span><div class="share-container"><ul class="dd-share-module--buttons"><li class="dd-share-module--button-wrap dd-share-module--button-wrap-facebook"><div class="dd-share-button dd-share-button--facebook"><a class="dd-share-button--link dd-share-button--open-window dd-link" target="_blank"><i class="dd-share-button--icon dd-icon dd-icon-facebook dd-link-icon"></i><span class="dd-share-button--text link-txt">Share on Facebook</span></a></div></li><li class="dd-share-module--button-wrap dd-share-module--button-wrap-twitter"><div class="dd-share-button dd-share-button--twitter"><a href="" class="dd-share-button--link dd-share-button--open-window dd-link" target="_blank"><i class="dd-share-button--icon dd-icon dd-icon-twitter dd-link-icon"></i><span class="dd-share-button--text link-txt">Share on Twitter</span></a></div></li></ul></div></span></div></div>';
			$("#header").append(winstate);
			$(".dd-winstate").addClass("hide"); //hide so it can be revealed duing showFeedback
		}

		//This loads every every slide; shows your score and lets you click to the next slide
		function loadRecap() {
			$("#container").append('<div id="recap"></div>');
			$("#recap").addClass("hide"); //hide on initial load, so it can slide down when you press the start button
			var output = '<div class="col"><span class="header">Your Time:</span><span class="large">00:00</span></div>';

			$("#recap").append(output);

			$("#recap").append('<div class="col"><a href="#" class="answer next">Next Image</a></div>');

			$(".answer.next").click(function(event) {
				event.preventDefault();
				if (!$(this).hasClass("inactive")){
					$(".answer.next").addClass("inactive");
					$("#recap").slideUp();
					nextSlide();
				}
			});
		}

		function loadCaption() {
			//$("#slide-"+G.currentSlide).append("<p>This is a test</p>");
			$("#container").append('<div class="caption"><p>'+G.slides[G.currentSlide].caption+'</p></div>');
			$(".caption").addClass("hide"); //hide on initial load, so it can slide down when you press the start button
		}

		function loadFirstPuzzle() {
			loadHeader();
			loadRecap();
			loadPuzzle(G.currentSlide, false); //false means don't auto-play (ie, show the start button)


			G.totalSecondsElapsed = 0;
		}

		function loadPuzzle(s, t) { //s is the current slide, and t is whether or not to load the start button

			//TODO: Move these functions elsewhere
			function shuffle(a) {
				var j, x, i;
				for (i = a.length; i; i -= 1) {
					j = Math.floor(Math.random() * i);
					x = a[i - 1];
					a[i - 1] = a[j];
					a[j] = x;
				}
			}

			function clone(obj) {
				if (null == obj || "object" != typeof obj) return obj;
				var copy = obj.constructor();
				for (var attr in obj) {
					if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
				}
				return copy;
			}


			//Make the wrapper
			$("#container").append('<div class="slide slide-'+s+'" id="slide-'+s+'">');

			//start the puzzle after the current image loads
			G.img = new Image();
			G.img.onload = function() {
				//console.log("image "+s+" is loaded");
				initPuzzleTiles(s, t); // load a puzzle in the current slide
			}
			G.img.src = G.image;

			$("#container").append('</div>');

			//Update the counter in the header
			var currentSlideCount = G.currentSlide + 1;
			$(".progress").html(""+currentSlideCount+" of "+G.slides.length+"");

			//Zero out the timer in the header
			$(".score").html("00:00");



		}/* End loadPuzzle */

		//TODO: account for when it gets to the end
		function preloadNextImage(s) {
			var img = new Image();
			img.onload = function() {
				//console.log("next image "+nextSlide+" is preloaded");
			}
			var nextSlide = s+1;
			img.src = G.slides[nextSlide].image;
		}

		function nextSlide() {
			//console.log("nextSlide function");
			//fade out current slide
			$(".caption").fadeOut(function(){
				$(".caption").remove();
			});
			$("#slide-"+G.currentSlide).fadeOut(function(){
				//after fading out current slide, load the next slide
				//debugger;
				if (G.currentSlide < G.slides.length-1) {
					G.currentSlide++
					loadPuzzle(G.currentSlide, true); //true means autoplay (no start button)
				} else {
					//alert("that's the end!");
					showEndScreen();
				}
			});
			//remove inactive class from the next slide button
			$(".answer.next").removeClass("inactive");
		}

		function showEndScreen() {

			//console.log("custom_event: puzzle finished");
			//console.log("custom_event: puzzle finished time: "+G.totalSecondsElapsed);

			//calculate average time for each of the slides you've played
			var scores = [];
			for (var i=0;i<G.slides.length;i++) {
				scores.push(G["slide"+i+"SecondsElapsed"]);
			}
			var sum = 0;
			for( var i = 0; i < scores.length; i++ ){
			    sum += parseInt( scores[i], 10 ); //don't forget to add the base
			}
			var avg = sum/scores.length;
			//console.log("average score is "+avg);
			var formattedAverage = secondsToTime(Math.floor(avg));

			var content = '';
			content += '<div class="score-recap">';
			//content += '<span class="header">Average Time:</span><span class="large">'+G.pointsSoFarForDisplay+" / "+G.totalPoints+'</span>';
			content += '<span class="header">Average Time:</span><span class="large">'+formattedAverage+'</span>';
			//content += '<span class="header"><a class="answer" href="" onClick="window.opener.location.reload(false);">Try Again</a></span>';
			content += '</div>';
			$("#container").append(content);
			$(".score-recap").fadeIn();
			// rudimentary tracking
			logEvent( { type: "completed", metrics: { "points": G.pointsSoFarForDisplay, "total_time": sum, "average_time": avg } } );
		}


		function logEvent( data ) {
			$( window ).trigger( gameEventName, data );
		}

		function showFeedback() {

			//here's where it says "correct!"
			//$( window ).trigger( gameEventName, [ 'answer' ] );
			logEvent( { type: "puzzle solved", attrs: { "slide": G.currentSlide }, metrics: { "puzzle_time": G["slide"+G.currentSlide+"SecondsElapsed"] } } );
			logEvent( { type: "completed", attrs: { "slide": G.currentSlide }, metrics: { "puzzle_time": G["slide"+G.currentSlide+"SecondsElapsed"] } } );

			$("#container").addClass('winner');
			var slideNum = G.currentSlide+1; //
			var progress = slideNum+" of "+G.slides.length;
			//console.log("Slide "+progress+" completed in "+G["slide"+G.currentSlide+"SecondsElapsed"]+" seconds");

			//add the score to the recap
			var formattedSeconds = secondsToTime(G["slide"+G.currentSlide+"SecondsElapsed"]);
			$("#finaltime").html(formattedSeconds);

			attachSocialText(formattedSeconds);

			$(".score").slideUp();
			$(".dd-winstate").slideDown();

			/*
			$(".feedbacktext").addClass("visible");
			setTimeout(function(){
				$(".feedbacktext").fadeOut(1500);
			}, 500);
			setTimeout(function(){
				$("#recap").slideDown();
				$(".caption").fadeIn();
			}, 500);
			*/
		}

		function attachSocialText( time ) {
			var url = window.location.href;
			// share with the parent url
			// TODO get app id and twitter handle from iFrame settings
			if ( parent !== window ) {
				url = document.referrer;
			}
			//var shareString = "I solved the puzzle in " + time + "! " + HRSTGAME.title + ": " + url;
			var shareText = "I solved the puzzle in "+time+"!";
			//var shareStringUrlEncoded = encodeURI(shareString);
			var shareTextUrlEncoded = encodeURI(shareText);
			var titleUrlEncoded = encodeURI( HRSTGAME.title );
			var urlUrlEncoded = encodeURI(url);
			$(".dd-share-button--twitter .dd-share-button--link")
				.attr("href", "//www.twitter.com/share?url="+url+"&text="+shareTextUrlEncoded+" "+ G.challenge +"&via=" + G.siteconfig.twitter )
				.attr( 'data-share-type','twitter' );
			$(".dd-share-button--facebook .dd-share-button--link")
				.attr("href", "https://www.facebook.com/sharer/sharer.php?app_id=" + G.siteconfig.fb + "&sdk=joey&u="+urlUrlEncoded+"&display=popup&ref=plugin&src=share_button")
				.attr( 'data-share-type', 'facebook' );
			//$(".dd-share-button--whatsapp .dd-share-button--link").attr("href", "whatsapp://send?text="+shareString+"").attr( 'data-share-type', 'whatsapp' );
			//$(".dd-share-button--whatsapp .dd-share-button--link").attr("data-action", "share/whatsapp/share");

			// report any share link click
			$(".dd-share-button--link").on( 'click', function( event ) {
				//HRSTGAME.track( 'share ' + $( this ).data('share-type') );
				//todo: add new log events for social share
			});

		}


		function initPuzzleTiles(s, t) { //s is the current slide, t is autoplay status

			//set up variables
			//G.cols = G.slides[s].cols || 2;
			//G.rows = G.slides[s].rows || 2;
			//G.image = G.slides[s].image;
			G.dragThreshhold = "40%";

			//clear out variables from previous slides
			G.list = [];
			G.tiles = [];
			G.list = $("#slide-"+G.currentSlide+"");
			G.tiles  = G.list[0].getElementsByClassName("box");

			//Set up the "Next Slide" or "View Results" text on next button

			if (G.currentSlide < G.slides.length-1) {

			} else {
				$(".answer.next").html("See Results");
			}

			//Set up correct and shuffled orders
			G.numTiles = G.rows * G.cols;
			var tiles = [];
			for (var i=0;i<G.numTiles;i++) {;
				tiles.push(i);
			}
			var clone = tiles.slice(0);
			G.correctOrder = tiles;
			shuffle(clone);
			G.shuffledOrder = clone;

			//preload one of the images and capture its original width and height, then trigger the positioning stuff
			var img = new Image();
			img.onload = function(){
			  	G.originalHeight = img.height;
			  	G.originalWidth = img.width;
				for (var i=0;i<(G.cols*G.rows);i++) {
					createTile(i);
				}
			}
			img.src = G.image;

			//loadCaption();

			//add the blocker, hide it by default
			$("#slide-"+G.currentSlide+"").append('<div class="blocker hide"></div>');

			//show the blocker and start button if autoplay is false
			if (t == false) {
				$(".blocker").removeClass('hide');
				$("#slide-"+G.currentSlide+"").append('<a href="#" class="answer start">Start</a>');

				//set up start button that will be on the first puzzle only
				$(".start").click(function(event) {
					event.preventDefault();
					if (!$(this).hasClass("inactive")){
						$(".start").addClass("inactive");
						$(".start").fadeOut();
						$("#header").slideDown();
						$(".blocker").fadeOut(function(){
							startTimer();
							//console.log("custom_event: slide started"); //NOTE: the other way of starting a slide is a few lines below. TODO: need to get slide ID
							logEvent( { type: "puzzle started", attrs: { "button_text": $(this).text() }  } );
						});
					}
				});
				logEvent( { type: "loaded" } );
			} else {
				//t is true, so there's autoplay. Start the timer.
				startTimer();
				//console.log("custom_event: slide started"); //NOTE: the other way of starting a slide is a few lines above, when you click the Start button. TODO: need to get slide ID
				logEvent( { type: "puzzle started", attrs: { "autoplay": "true", slide: G.currentSlide }  } );
			}


			function startTimer() {
				//Set up the time for this slide, and start the timer
				G["slide"+G.currentSlide+"SecondsElapsed"] = 0;
				myTimer(); //start the timer immediately
			}

			//Create the success state, but by default it's hidden in the CSS NOTE: the size is changed in layoutInvalidated
			var content = '';
			content += '<span class="correct-holder"><span class="correct">Correct!</span></span>';
			$("#slide-"+G.currentSlide).append('<div class="feedbacktext">'+content+'</div>');


		// ========================================================================
		//  CREATE TILE
		// ========================================================================
		function createTile(i) {

		  //Create element and give it proper classes, attached tile element
		  //var element = $(".box-"+i);

		  //create list of scrambled nubmers (outside this loop)
		  //assign the index of the scrambled number below, ie, scrambled[i]


		  //var innerHtml = "Box "+i;
		  var innerHtml = "";
		  var element = $("<div></div>").addClass("box box"+i+"").html(innerHtml).attr('data-order', G.shuffledOrder[i]);;
		  var varname = "box"+i+"draggable";
		  G[varname] = Draggable.create(element, {
			onDrag      : onDrag,
			onPress     : onPress,
			onRelease   : onRelease,
			zIndexBoost : true
		  });


			//console.log(G[varname][0]._eventTarget);
		  var tile = {
			element    : element,
			height     : 0,
			inBounds   : false,
			index      : i,
			order      : G.shuffledOrder[i],
			/*order      : i,*/
			isDragging : false,
			lastIndex  : null,
			width      : 0,
			x          : 0,
			y          : 0
		  };

		  //Add the tile for easy lookup
		  element[0].tile = tile;

		  //add the tiles to the container
		  $("#slide-"+G.currentSlide+"").append(element);

		  layoutInvalidated();

		  function onPress() {

			//console.log("pressing");

			if (tile.positioned) {
				//console.log(">>tile is positioned");
			  			element[0].tile.fromX = element[0].tile.x;
						element[0].tile.fromY = element[0].tile.y;
						element[0].tile.toX = element[0].tile.x;
						element[0].tile.toY = element[0].tile.y;
			  	} else {
			  		//console.log(">>INTERCEPTED! tile is NOT positioned, so assign its values to where it was headed...");
			  		//here, assumt it's being positioned, so assign the FROM to the current X and Y vals
			  		//alert("not positioned");
			  		element[0].tile.fromX = element[0].tile.toX;
					element[0].tile.fromY = element[0].tile.toY;
					element[0].tile.x = element[0].tile.toX;
					element[0].tile.y = element[0].tile.toY;
			  	}

			tile.isDragging = true;

			$(element).addClass("dragging");

			TweenLite.to(element, 0.3, {
			  scale     : 0.92,
			  ease		: Elastic.easeOut
			});


		  }

		  function onDrag() {

		  	//TODO - make this into a function, NOTE: it's also in the OnClick event
			this._eventTarget.tile.swapPartner = null;
			tile.positioned = false;
			//debugger;

			for (var i = 0; i < G.tiles.length; i++) {
			  if (this.hitTest(G.tiles[i], G.dragThreshhold)) {

				tile.swapPartner = i;

				}
			}

			//console.log("currently hitting "+G.hitting);

		  }

		  function onRelease() {

		  	//debugger;
		  	//console.log("releasing");

		  	tile.isDragging = false;
			//todo: check if the tile's dragging is not true!!!

			$(element).removeClass("dragging");

			TweenLite.to(element, .2, {
			  scale     : 1,
			  ease		: Strong.easeOut
			});

			//if it's hitting something and that something is positioned = true

			if (G.swapHappening == true) {
				//alert("Swap happening!");
				//alert("don't do it");
			} else {

			}

			/*
			if (G.tiles[G.hitting] != null) {
				//console.log(">>G.hitting is true, hitting index: "+G.tiles[G.hitting].tile.index);
				//console.log(">>target is positioned and is: "+G.tiles[G.hitting].tile.positioned);
				if (G.tiles[G.hitting].tile.positioned) {
					//if it's released on a tile that's positioned, ie, stationary AND there's not a swap happening
					console.log(">>changePosition: "+tile.index+" "+G.hitting);
					changePosition(tile.index, G.hitting);
				} else {
					console.log("hitting something, but it's on motion - GO BACK TO START");
					returnHome();
				}
			} else {
				console.log(">>not hitting anything - GO BACK TO START");
				returnHome();
			}
			*/

			if (tile.swapPartner != null) {
				//alert("swap!");
				if (G.tiles[tile.swapPartner].tile.positioned) {
					//if it's released on a tile that's positioned, ie, stationary
					changePosition(tile.index, tile.swapPartner);
				} else {
					//console.log("hitting something, but it's on motion - GO BACK TO START");
					returnHome();
				}
			} else {
				returnHome();
			}


			function returnHome() {
					//alert('hi');
					//if there's a toY, go there. If not, go to the built-in X or Y
					var myToX = element[0].tile.toX;
					var myToY = element[0].tile.toY;
					element[0].tile.positioned = false;
					var myTween = TweenLite.to(element, G.returnHomeTime, {
						  scale     : 1,
						  x         : Math.floor(myToX),
						  y         : Math.floor(myToY),
						  ease		: Elastic.easeOut,
						onComplete:function(){
						element[0].tile.positioned = true;
						}
					});
				}


			//alert(targetIsPositioned);
			//debugger;
			if (G.tiles[G.hitting]) {
				//var isPositioned = true;
			} else {
				//var isPositioned = false;
			}
			//alert(targetIsPositioned);

		  }

		}/* End create tile */


		// ========================================================================
		//  CHANGE POSITION
		// ========================================================================
		//changePosition(tile, tile.index, G.hitting);
		function changePosition(from, to) {

			//var $tiles = $(".box");
			var $tiles = $("#slide-"+G.currentSlide+" .box");

			//make the fromX the X pos of the from tile
			//$tiles.eq(from)[0].tile.fromX = $tiles.eq(from)[0].tile.x;
			//$tiles.eq(from)[0].tile.fromY = $tiles.eq(from)[0].tile.y;
			//alert("from x and y is "+$tiles.eq(from)[0].tile.fromX+" and "+$tiles.eq(from)[0].tile.fromY);

			var fromOrder = $tiles.eq(from)[0].tile.order;
			var toOrder = $tiles.eq(to)[0].tile.order;

			var toX = $tiles.eq(to)[0].tile.x;
			var toY = $tiles.eq(to)[0].tile.y;

			//FROM TILE: make its toX the X pos of the TO tile
			$tiles.eq(from)[0].tile.toX = toX;
			$tiles.eq(from)[0].tile.toY = toY;

			var swapTime = G.swapTime;

			//TO TILE: make its toX the fromX of the FROM tile
			$tiles.eq(to)[0].tile.toX = $tiles.eq(from)[0].tile.fromX;
			$tiles.eq(to)[0].tile.toY = $tiles.eq(from)[0].tile.fromY;

			//TO TILE: make its fromX the toX of the TO tile
			$tiles.eq(to)[0].tile.fromX = toX;
			$tiles.eq(to)[0].tile.fromY = toY;

			//console.log(toX);
			//alert("from "+fromOrder+" to "+toOrder);

			$tiles[from].tile.x = getXPositionFromIndex(toOrder);
			$tiles[from].tile.y = getYPositionFromIndex(toOrder);

			//debugger;

			//Move the elements
			//console.log(e);
			var tween1 = TweenLite.to($tiles[from], swapTime, {
				x : Math.floor(toX),
				y : Math.floor(toY),
				ease:Strong.easeInOut,
				onComplete : function() {

					$tiles[from].tile.positioned = true;
					$tiles[from].tile.swapPartner = null;

					$tiles.eq(from).attr("data-order",toOrder);
					G.hitting = null;

				},
				onStart    : function() {
					$tiles[from].tile.positioned = false;
					$tiles[from].tile.order = toOrder;
				}
			  });
			//the second tile (to)
			var tween2 = TweenLite.to($tiles[to], swapTime, {
				x : Math.floor($tiles[from].tile.fromX),
				y : Math.floor($tiles[from].tile.fromY),
				ease:Strong.easeInOut,
				onComplete : function() {
					$tiles[to].tile.positioned = true;

					$tiles[to].tile.x = getXPositionFromIndex(fromOrder);
					$tiles[to].tile.y = getYPositionFromIndex(fromOrder);
					$tiles.eq(to).attr("data-order",fromOrder);

					//check the orders
					var currentOrder = [];
					$("#slide-"+G.currentSlide+" .box").each(function(index, element) {
						var tile = this.tile;
						currentOrder.push(tile.order);
						//console.log(tile.order);

					});
					//console.log("correct order is "+G.correctOrder);
					//console.log("current order is "+currentOrder);
					G.numMoves++;
					if (G.numMoves == 1) {
						var moves = "move"
					} else {
						var moves = "moves"
					}
					$('.moves').html(G.numMoves+" "+moves);
					if (arraysEqual(G.correctOrder, currentOrder)){

						$(".blocker").show();
						setTimeout(function(){
							//alert("Success! You finished the puzzle in in "+G.numMoves+" "+moves);

							showFeedback();
							//console.log("custom_event: slide finished");
							//console.log("custom_event: slide finished time: "+G["slide"+G.currentSlide+"SecondsElapsed"]);
						}, 0);

						//stop timer
						//console.log("stopping the timer")
						clearTimeout(G.t);
					}
					G.swapHappening = false; //only allow 1 swap to happen at a time
					$tiles[to].tile.swapPartner = null;


				},
				onStart    : function() {
					$tiles[to].tile.positioned = false;
					$tiles[to].tile.order = fromOrder;
					G.swapHappening = true; //only allow 1 swap to happen at a time
				}
			  });



		  //layoutInvalidated();
		}

		function arraysEqual(arr1, arr2) {
			if(arr1.length !== arr2.length)
				return false;
			for(var i = arr1.length; i--;) {
				if(arr1[i] !== arr2[i])
					return false;
			}
			return true;
		}

		//This looks at the cols and rows to figure out an items x and y coordinates based on its index
		function getYPositionFromIndex(index) {
			var indexAdjusted = index+1;
			var val = Math.ceil(indexAdjusted / G.cols );
			return val * G.boxHeight - G.boxHeight;
		}

		function getXPositionFromIndex(index) {
			var indexAdjusted = index;
			var itemsperrow = G.cols;
			var val = Math.floor(indexAdjusted % G.cols);
			var position = val+1;
			if ((position * G.boxWidth) - G.boxWidth < 1) {
				return 0;
			} else {
				return (position * G.boxWidth) - G.boxWidth;
			}
		}



		// ========================================================================
		//  LAYOUT INVALIDATED
		// ========================================================================
		function layoutInvalidated() {
			//console.log('layoutInvalidated();');
			//var timeline = new TimelineMax();

			G.containerwidth = $container.width();
			G.boxWidth = G.containerwidth / G.cols;
			var imageResizeRatio = G.containerwidth / G.originalWidth;
			var modifiedHeight = G.originalHeight * imageResizeRatio;
			G.boxHeight = modifiedHeight / G.rows;

			//Assign the BG image to all boxes here. will position and scale it below
			$('.box').css('background-image', 'url(' + G.image + ')');
			$('.box').css('background-size', G.containerwidth+'px');

			$(".box").each(function(index, element) {

				//for each box, update its variables then move/scale it appropriately
				var tile = this.tile;
				$.extend(tile, {
					  x      : getXPositionFromIndex(tile.order),
					  y      : getYPositionFromIndex(tile.order),
					  width  : G.boxWidth,
					  height : G.boxHeight
					});

				//Assign and scale the BG image
				$(element).css('background-position', -getXPositionFromIndex(tile.index)+"px "+-getYPositionFromIndex(tile.index)+"px");
				TweenLite.to(element, G.swapTime, {
					x : Math.floor(tile.x),
					y : Math.floor(tile.y),
					width : tile.width,
					height : tile.height,
					ease:Strong.easeInOut,
					onComplete : function() { tile.positioned = true; },
					onStart    : function() { tile.positioned = false; }
				  });
			});

			//Make the container the height of the puzzle - this helps with positioning the start button in the center
			$("#slide-"+G.currentSlide+"").height(G.originalHeight*imageResizeRatio);

			//adjust the score size and placement
			//make the success states huge: https://github.com/davatron5000/FitText.js
			var canvasHeight = $("#slide-"+G.currentSlide).height();

		}/* end layoutinvalidated */

		//Turn on this code chunk below for debugging

		/*
		function step(timestamp) {
			//output the tile variables to each card
			for (var i = 0; i < G.tiles.length; i++) {
				function objToString (obj) {
					var str = '';
					for (var p in obj) {
						if (obj.hasOwnProperty(p)) {
							str += p + '::' + obj[p] + '<br />';
						}
					}
					return str;
				}
				$(".box"+i).html(objToString(G.tiles[i].tile));

				//debugger;
			}
			//console.log(G.swapHappening);
			console.log("currently hitting "+G.hitting);
		  window.requestAnimationFrame(step);
		}
		window.requestAnimationFrame(step);
		*/






			$(window).resize(resize);
			function resize() {
				//console.log('resie');
				//initWidths();
				layoutInvalidated();
			}



		}/* End Init */


		function add() {
			G["slide"+G.currentSlide+"SecondsElapsed"]++;
			G.totalSecondsElapsed++; //for analytics
			var formattedSeconds = secondsToTime(G["slide"+G.currentSlide+"SecondsElapsed"]);
			$(".score").html(formattedSeconds);
			//debugger;
			myTimer();
		}
		function myTimer() {
			G.t = setTimeout(add, 1000);
		}

		function shuffle(a) {
			var j, x, i;
			for (i = a.length; i; i -= 1) {
				j = Math.floor(Math.random() * i);
				x = a[i - 1];
				a[i - 1] = a[j];
				a[j] = x;
			}
		}

		function clone(obj) {
			if (null == obj || "object" != typeof obj) return obj;
			var copy = obj.constructor();
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
			}
			return copy;
		}


		function timeToSeconds(i) {
			var a = i.split(':'); // split it at the colons
		  	var hours = parseInt(a[0]);
		  	var minutes = parseInt(a[1]);
		  	var seconds = (hours * 60 + minutes);
		  	return seconds;
		}

		function secondsToTime(secs)
		{
			var date = new Date(secs * 1000);
			var mm = date.getUTCMinutes();
			var ss = date.getSeconds();
			// If you were building a timestamp instead of a duration, you would uncomment the following line to get 12-hour (not 24) time
			// if (hh > 12) {hh = hh % 12;}
			// These lines ensure you have two-digits
			if (mm < 10) {mm = "0"+mm;}
			if (ss < 10) {ss = "0"+ss;}
			// This formats your string to HH:MM:SS
			var t = mm+":"+ss;
			return t;
		}

		function isInArray(value, array) {
		  return array.indexOf(value) > -1;
		}
	}



});

var gameEventName = "game:puzzle";

var HRSTGAME = HRSTGAME || {};
HRSTGAME.gameid = hearstGameId;
HRSTGAME.gametype = "unscramble";
HRSTGAME.parentUrl = "unknown";
if ( parent != window ) {
	HRSTGAME.parentUrl = document.referrer;
}

$( document ).ready( function() {

	// TODO move elsewhere
	$( window ).on( gameEventName, function( event, message ) {

		if ( typeof mobileAnalyticsClient == "object" ) {
			var eventType = message.type;
			var attributes = {};
			var metrics = {};
			attributes.gametype = HRSTGAME.gametype;
			attributes.gameid = HRSTGAME.gameid;
			attributes.embedsite = HRSTGAME.parentUrl;
			metrics.elapsed = 0;
			switch ( eventType ) {
			case 'loaded':
				HRSTGAME.starttime = Date.now();
				break;
			default:
				metrics.elapsed = Date.now() - HRSTGAME.starttime;
			}
			if ( typeof message.attrs == "object" ) {
				$.extend( attributes, message.attrs );
			}
			if ( typeof message.metrics == "object" ) {
				$.extend( metrics, message.metrics );
			}
			mobileAnalyticsClient.recordEvent( eventType, attributes, metrics );
			console.log( { eventType: eventType, attributes: attributes, metrics: metrics } );
			if ( eventType == 'completed' ) {
				console.log( 'done' );
				mobileAnalyticsClient.submitEvents();
			}
		}
	});
});
