/* image scramble code 
 *
 * this code is a different puzzle type, separate from all the existing code.
 *
 */

$( document ).ready(function() {

	var globalVars = {};
	$container = $("#container");
	
	function gameLoad( ) {
		$.getJSON( dataUrl, function( data ) {
			gameBegin( data );
			globalVars.data = data;
			//console.log( data );
		});
	}
	
	gameLoad();
	
	function gameBegin( gameData ) {

		//Quick hack to feed the source image into the query string, instead of loading it from the JSON
		
		//if the imageUrl variable exists, then it was set in demo.php along with the numRows and numCols
		if ( typeof imageUrl == "string" ) {
			globalVars.image = imageUrl;
			globalVars.rows = numRows;
			globalVars.cols = numCols;
		} else {
			//...otherwise we load the image, rows, and cols from the JSON
			globalVars.image = gameData.slides.image1.url;
			switch ( gameData.settings.complexity ) {
			case 'hard':
				globalVars.rows = 4;
				globalVars.cols = 4;
			case 'easy':
			default:
				globalVars.rows = 3;
				globalVars.cols = 3;
				break;
			}
		}
		init();
		
		//Add the things we'll need globally to the globalVars object
		globalVars.list = $("#container");
		globalVars.tiles  = globalVars.list[0].getElementsByClassName("box");
		globalVars.numMoves = 0;
		globalVars.shadow1 = "none";
		globalVars.shadow2 = "0 6px 10px 0 rgba(0, 0, 0, 0.3), 0 2px 2px 0 rgba(0, 0, 0, 0.2)";
		globalVars.dragThreshhold = "40%"
		globalVars.swapTime = .2;
		globalVars.swapTimeElastic = .7;
		globalVars.dragName = "";
	}
	
	function init() {
	
		var numTiles = globalVars.rows * globalVars.cols;
		var tiles = [];
		for (var i=0;i<numTiles;i++) {;
			tiles.push(i);
		}
		
		//make a duplicate of the tiles so we can shuffle it for the initial order
		var clone = tiles.slice(0);
		globalVars.correctOrder = tiles;
		shuffle(clone);
		globalVars.shuffledOrder = clone;
		
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
		
		//preload the image to capture its original width and height, then create the tiles asynchronously
		var img = new Image();
		img.onload = function(){
		  	globalVars.originalHeight = img.height;
		  	globalVars.originalWidth = img.width;
			for (var i=0;i<(globalVars.cols*globalVars.rows);i++) {
				createTile(i);
			}
		}
		img.src = globalVars.image;
		
	// Timer code: http://jsfiddle.net/oukjfavu/
	var h1 = document.getElementById('stopwatch'),
		start = document.getElementById('startme'),
		stop = document.getElementById('stop'),
		seconds = 0, minutes = 0,
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
		$(".stopwatch").html((minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds));
		myTimer();
	}
	function myTimer() {
		t = setTimeout(add, 1000);
	}
	myTimer();
	
	
	// ========================================================================
	//  CREATE TILE
	// ========================================================================
	function createTile(i) {
	  
		var innerHtml = "";
		var element = $("<div></div>").addClass("box box"+i+"").html(innerHtml).attr('data-order', globalVars.shuffledOrder[i]);;
		var varname = "box"+i+"draggable";
			globalVars[varname] = Draggable.create(element, {
			onDrag      : onDrag,
			onPress     : onPress,
			onRelease   : onRelease,
			zIndexBoost : true
		});
	  
		var tile = {
			element    : element,
			height     : 0,
			inBounds   : false,
			index      : i,
			order      : globalVars.shuffledOrder[i],
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
		$("#container").append(element);
		
		layoutInvalidated();
		
		function onPress() {
				//If the tile is "positioned" (ie, not moving), assign its "from" and "to" values to its current position
				//these "to" and "from" values will be overwritten if we dectect any overlaps further in the code,
				//but setting them here provides a good default if the user starts dragging and releases without overlapping with anything
				if (element[0].tile.positioned) {
					element[0].tile.fromX = element[0].tile.x;
					element[0].tile.fromY = element[0].tile.y;
					element[0].tile.toX = element[0].tile.x;
					element[0].tile.toY = element[0].tile.y;
				} else {
					//here, assume the tile is in motion, so assign its FROM to its designated X and Y vals (which is where it's headed; set in the changePosition function)
					element[0].tile.fromX = element[0].tile.toX;
					element[0].tile.fromY = element[0].tile.toY;
					element[0].tile.x = element[0].tile.toX;
					element[0].tile.y = element[0].tile.toY;
				}
				
			tile.isDragging = true;
			
			TweenLite.to(element, 0.3, {
			  scale     : 0.92,
			  ease		: Elastic.easeOut
			});
	  	}
	  

		function onDrag() {
	  		globalVars.hitting = null;
			tile.positioned = false;
			//loop through all the tiles
			for (var i = 0; i < globalVars.tiles.length; i++) {
				//if this tile is hitting any of the other tiles...
				if (this.hitTest(globalVars.tiles[i], globalVars.dragThreshhold)) {
					//...then assign the global variable of the index of the tile that's being hit
					globalVars.hitting = i;
				} 
			}
			console.log("currently hitting "+globalVars.hitting);
		}

		function onRelease() {
	  
			tile.isDragging = false;
			
			TweenLite.to(element, .2, {
			  scale     : 1,
			  ease		: Strong.easeOut
			});
			
			//if it's hitting something...
			if (globalVars.tiles[globalVars.hitting] != null) {
				//...and that something is positioned = true, then we know it's a stationary tile that's good to be swapped with
				if (globalVars.tiles[globalVars.hitting].tile.positioned) {
					changePosition(tile.index, globalVars.hitting);
				} else {
					//here, it's hitting something, but that something is in motion doing something else, so send this tile back to where it came from
					returnHome();
				}
			} else {
				//this tile isn't hitting anything, so send it back to where it came from
				returnHome();
			}
		
		
		function returnHome() {
				console.log(element[0].tile.toX);
				var myToX = element[0].tile.toX;
				var myToY = element[0].tile.toY;
				element[0].tile.positioned = false;
				var myTween = TweenLite.to(element, globalVars.swapTimeElastic, {
					  scale     : 1,
					  x         : Math.floor(myToX),
					  y         : Math.floor(myToY),
					  ease		: Elastic.easeOut,
					onComplete:function(){
					element[0].tile.positioned = true;
					}
				});
			}
		}
	
	}/* End create tile */
	
	
	// ========================================================================
	//  CHANGE POSITION
	// ========================================================================
	//changePosition(tile, tile.index, globalVars.hitting);
	function changePosition(from, to) {
		
		var $tiles = $(".box");

		var fromOrder = $tiles.eq(from)[0].tile.order;
		var toOrder = $tiles.eq(to)[0].tile.order;
		
		var toX = $tiles.eq(to)[0].tile.x;
		var toY = $tiles.eq(to)[0].tile.y;
		
		//FROM TILE: make its toX the X pos of the TO tile
		$tiles.eq(from)[0].tile.toX = toX;
		$tiles.eq(from)[0].tile.toY = toY;
		
		var swapTime = globalVars.swapTime;
		
		//TO TILE: make its toX the fromX of the FROM tile
		$tiles.eq(to)[0].tile.toX = $tiles.eq(from)[0].tile.fromX;
		$tiles.eq(to)[0].tile.toY = $tiles.eq(from)[0].tile.fromY;
		
		//TO TILE: make its fromX the toX of the TO tile
		$tiles.eq(to)[0].tile.fromX = toX;
		$tiles.eq(to)[0].tile.fromY = toY;
				
		$tiles[from].tile.x = getXPositionFromIndex(toOrder);
		$tiles[from].tile.y = getYPositionFromIndex(toOrder);
		
		//Move the elements
		//the first of the 2 moves (the "from" tile)
		var tween1 = TweenLite.to($tiles[from], swapTime, {
			//Set the floor value to minimize gaps between the elements
			x : Math.floor(toX),
			y : Math.floor(toY),
			ease:Strong.easeInOut,
			onComplete : function() { 
				$tiles[from].tile.positioned = true;
				$tiles[from].tile.order = toOrder;
				$tiles.eq(from).attr("data-order",toOrder);
				globalVars.hitting = null;
			},
			onStart    : function() { 
				$tiles[from].tile.positioned = false;
			}
		  });
		
		//the second tile (to)
		var tween2 = TweenLite.to($tiles[to], swapTime, {
			//Set the floor value to minimize gaps between the elements
			x : Math.floor($tiles[from].tile.fromX),
			y : Math.floor($tiles[from].tile.fromY),
			ease:Strong.easeInOut,
			onComplete : function() { 
				$tiles[to].tile.positioned = true;
				$tiles[to].tile.order = fromOrder;
				$tiles[to].tile.x = getXPositionFromIndex(fromOrder);
				$tiles[to].tile.y = getYPositionFromIndex(fromOrder);
				$tiles.eq(to).attr("data-order",fromOrder);
				
				//These are things that should be checked after BOTH the pieces move, but the code is here for now, since the duration of tween1 and tween2 is the same. needs optimization.
				//check the orders
				var currentOrder = [];
				$(".box").each(function(index, element) {	
					var tile = this.tile;
					currentOrder.push(tile.order);
				});
				globalVars.numMoves++;
				if (globalVars.numMoves == 1) {
					var moves = "move"
				} else {
					var moves = "moves"
				}
				$('.moves').html(globalVars.numMoves+" "+moves);
				if (arraysEqual(globalVars.correctOrder, currentOrder)){					
					setTimeout(function(){ 
						var finalTime = $('.stopwatch').html();
						alert("Success! You finished the puzzle in "+finalTime+" seconds in "+globalVars.numMoves+" "+moves);
					}, 200);
					//stop timer
					clearTimeout(t);
				}				
			},
			onStart    : function() { 
				$tiles[to].tile.positioned = false;
			}
		  });
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
	
	//These functions look at the cols and rows to figure out an items x and y coordinates based on its index
	//They can/should be combined eventually when being optimized
	function getYPositionFromIndex(index) {
		var indexAdjusted = index+1;
		var val = Math.ceil(indexAdjusted / globalVars.cols );
		return val * globalVars.boxHeight - globalVars.boxHeight;
	}
	
	function getXPositionFromIndex(index) {
		var indexAdjusted = index;
		var itemsperrow = globalVars.cols;
		var val = Math.floor(indexAdjusted % globalVars.cols);
		var position = val+1;
		if ((position * globalVars.boxWidth) - globalVars.boxWidth < 1) {
			return 0;
		} else {
			return (position * globalVars.boxWidth) - globalVars.boxWidth;
		}
	}
	
	
	
	// ========================================================================
	//  LAYOUT INVALIDATED
	// ========================================================================
	//This recalculates the position and size of the tiles for when the page is created or resized
	function layoutInvalidated() {
		globalVars.containerwidth = $container.width();
		globalVars.boxWidth = globalVars.containerwidth / globalVars.cols;
		var imageResizeRatio = globalVars.containerwidth / globalVars.originalWidth;
		var modifiedHeight = globalVars.originalHeight * imageResizeRatio;
		globalVars.boxHeight = modifiedHeight / globalVars.rows;
		$container.height( modifiedHeight );
					
		//Assign the BG image to all boxes here. will position and scale it below
		$('.box').css('background-image', 'url(' + globalVars.image + ')');
		$('.box').css('background-size', globalVars.containerwidth+'px');
		
		$(".box").each(function(index, element) {
		
			//for each box, update its variables then move/scale it appropriately
			var tile = this.tile;
			$.extend(tile, {
				  x      : getXPositionFromIndex(tile.order),
				  y      : getYPositionFromIndex(tile.order),
				  width  : globalVars.boxWidth,
				  height : globalVars.boxHeight
				});	
				
			//Assign and scale the BG image
			$(element).css('background-position', -getXPositionFromIndex(tile.index)+"px "+-getYPositionFromIndex(tile.index)+"px");
			
			TweenLite.to(element, .3, {
				x : Math.floor(tile.x),
				y : Math.floor(tile.y),
				width : tile.width,
				height : tile.height,
				ease:Strong.easeInOut,
				onComplete : function() { tile.positioned = true; },
				onStart    : function() { tile.positioned = false; }
			  });
		});

	}/* end layoutinvalidated */
	
		$(window).resize(resize);
		function resize() {
			//console.log('resie');
			//initWidths();
			layoutInvalidated();
		}		
		
	}/* End Init */
	
});
