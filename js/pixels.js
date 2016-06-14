// refactored photos.js with different JSON format
// global for "sharing"
var HRSTGAME = HRSTGAME || {};
HRSTGAME.gameid = hearstGameId;
HRSTGAME.gametype = "pixels";
HRSTGAME.parentUrl = "unknown";
if ( parent != window ) {
	HRSTGAME.parentUrl = document.referrer;
}

$( document ).ready(function() {

	var G = {};
	$container = $("#container");

	function gameLoad( ) {
		$.getJSON( dataUrl, function( data ) {
			gameBegin( data );
			G.data = data;
			HRSTGAME.data = data;
		});
	}

	gameLoad();

	function gameBegin( gameData ) {

		//load original image
		//var originalImageTag = '<img src="'+gameData[0].image+'" />';
		//$("#container").append(originalImageTag);

		//alert(gameData[0].image);
		G.list = $("#container");


		G.stepsPerSecond = 5;
		G.nextSlideDuration = 2000;
		G.successFadeOutDelay = 800;
		//G.nextSlideDuration = 9999999;
		//G.successFadeOutDelay = 9999999;
		G.numMoves = 0;
		G.slides = [];
		for ( var i in gameData.slides ) {
			G.slides.push( gameData.slides[ i ] );
		}
		G.slideDuration = gameData.settings.slideduration || 20;
		G.randomizeOrder = gameData.settings.randomizeOrder || "yes";
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

		G.initialQuality = .01;
		G.finalQuality = 1;
		//G.initialQuality = 1;
		//G.finalQuality = 0;

		if ( G.randomizeOrder == "yes") {
			//clone and shuffle
			var clone = G.slides.slice(0);
			shuffle(clone);
			G.slidesRandom = clone;
			G.slides = G.slidesRandom;
		}




		/* Start */
		//Load first slide
		preloadImages();
		//loadSlide(G.currentSlide);
		loadInstructions();
		//addInteractivity();

		//adjustWidths();

		function preloadImages(){
			for (var i=0;i<G.slides.length;i++) {
				//console.log('hi');
				var imageObject = new Image();
        		imageObject.src = G.slides[i].url;
			}
		}


		function loadHeader() {
			//Make the score
			$("#container").append('<div id="header"></div>');
			$("#header").append('<span class="progress">1 of 8</span>');
			//$("#header").append('<span class="pause" id="pause">Pause</span>');
			$("#header").append('<span class="score">Score: 0/100</span>');
		}

		function loadInstructions() {
			$("#container").append('<div class="intro">');
			//$(".intro").append('<h1>'+G.headline+'</h1>');
			if (G.slides.length == 1){
				var questionsText = "question";
			} else {
				var questionsText = "questions";
			}
			var exampleDuration = G.slides.length * (G.slideDuration / 2);
			//debugger;
			$(".intro").append('<p>This puzzle has '+G.slides.length+' '+questionsText+' and should take you around '+Math.round(exampleDuration)+' seconds to complete.</p>');
			$(".intro").append('<a href="#" class="answer start">Let\'s Go!</a>');
			$(".intro").append('<p><strong>How it works</strong>The faster you answer, the more points you get.</p>');
			$("#container").append('</div>');
			logEvent( { type: 'loaded' } );
			$(".start").click(function(event) {
				event.preventDefault();
				if (!$(this).hasClass("inactive")){
					$(".start").addClass("inactive");
					$(".intro").fadeOut(function(){
						loadHeader();
						loadSlide(G.currentSlide);
					});
				}
				logEvent( { type: "game started" } );

			});
		}

		function loadSlide(s) {

			//Make the wrapper
			$("#container").append('<div class="slide slide-'+s+'" id="slide-'+s+'">');

			//Make the canvas
			var output = '';
			output += '<canvas id="canvas-slide-'+s+'" />';
			$("#slide-"+s).append(output)

			var canvas = document.getElementById('canvas-slide-'+s);
			//Make the context global so we can access it everywhere
			G.ctx = canvas.getContext('2d');
			//console.log(ctx);
			G.img = new Image();
			//canvas.width = containerWidth;
			G.img.onload = function() {
				var originalWidth = G.img.width;
				var originalHeight = G.img.height;
				var imageResizeFactor = containerWidth / originalWidth;
				var calculatedHeight = originalHeight*imageResizeFactor;
				G.ctx.canvas.width = containerWidth;
				G.ctx.canvas.height = calculatedHeight;
				paintImage(G.initialQuality);
				startCountdown();
				$('.slide-'+s+'').fadeIn(function(){



					G.okToGuess = true;
					addInteractivity();
				});

			}
			G.img.src = G.slides[s].url;


			//make the timer
			$("#slide-"+s).append('<div class="timer"><span class="timer-bg"></span><span class="timer-fg"></span></div>');

			//load the answers
			var answers = G.slides[s].answers
			var answersOutput = '<div class="answers">';
			for (var i=0;i<answers.length;i++) {
				var correctClassOutput = "";
				if (answers[i].correct == true) {
					correctClassOutput = "correct";
				} else {
					correctClassOutput = "incorrect";
				}
				answersOutput += '<a href="#" class="answer answer-'+i+' '+correctClassOutput+'">'+answers[i].caption+'</a>';
			}
			answersOutput += '</div>';
			$("#slide-"+s).append(answersOutput);

			$("#container").append('</div>');

			//Update the counter in the header
			var currentSlideCount = G.currentSlide + 1;
			$(".progress").html(""+currentSlideCount+" of "+G.slides.length+"");


		}





		function startCountdown() {
			// Timer code: http://jsfiddle.net/oukjfavu/
			var h1 = document.getElementById('stopwatch'),
				start = document.getElementById('startme'),
				stop = document.getElementById('stop'),
				seconds = 0, minutes = 0,
				t;
			//myTimer();

			G.currentQuality = G.initialQuality;
			stepInterval = setInterval(step, 1000/G.stepsPerSecond);
			G.stepsElapsed = 0;
			G.percentComplete = 0;
		}

		function step() {
			var qualityRange = G.initialQuality - G.finalQuality;
			//var steps = G.slideDuration; //old
			var totalSteps = G.slideDuration*G.stepsPerSecond; //good
			var amountPerStep = qualityRange/totalSteps; //good
			var percentPerStep = 1/totalSteps; //good
			var timeElapsed = G.stepsElapsed / G.stepsPerSecond * 1000; //good
			if (G.stepsElapsed < totalSteps) { //good?
				var quality = easeInSine(G.percentComplete, timeElapsed, G.initialQuality, G.finalQuality, G.slideDuration*1000);
				//easing function: http://stackoverflow.com/a/8317722/1399181
				//cheat sheet: http://easings.net/
				//easing code: https://github.com/danro/jquery-easing/blob/master/jquery.easing.js
				paintImage(quality);
				//console.log("Quality: "+quality);
				var inversePercent = 100-G.percentComplete*100;
				$(".timer-fg").width(inversePercent+"%");

				//This makes the potential score linear, but then even if you do good, youre final score is still something like 65/100. Too sad, so let's use the similar easing function above
				//G.potentialPoints = G.pointsPerSlide*(inversePercent*.01);
				var inversePotentialPoints = easeInSine(G.percentComplete, timeElapsed, 0, G.pointsPerSlide, G.slideDuration*1000);
				G.potentialPoints = G.pointsPerSlide - inversePotentialPoints

				//console.log("Potential points: "+G.potentialPoints);

				G.stepsElapsed++; //good
				G.percentComplete = G.percentComplete+percentPerStep; //good
				//debugger;
			} else {
				//stop the countdown
				//debugger;
				clearInterval(stepInterval);
				nextSlide();
			}

		}


		var linear = function(percent,elapsed,start,end,total) {
			return start+(end-start)*percent;
		}

		var easeOutQuad = function (x, t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		}

		var easeInQuad = function (x, t, b, c, d) {
			return c*(t/=d)*t + b;
		}

		var easeInCubic = function (x, t, b, c, d) {
			return c*(t/=d)*t*t + b;
		}

		var easeInQuart = function (x, t, b, c, d) {
			return c*(t/=d)*t*t*t + b;
		}

		var easeInSine = function (x, t, b, c, d) {
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		}

		var easeInCirc = function (x, t, b, c, d) {
			return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
		}

		var easeInElastic = function (x, t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		}



		function paintImage(quality) {
			G.ctx.mozImageSmoothingEnabled = false;
			G.ctx.imageSmoothingEnabled = false;
			G.ctx.webkitImageSmoothingEnabled = false;
			//draw tiny image
			var tinyW = G.ctx.canvas.width * quality | 0; //or 0: works better than Math.floor, but doesn't work for negatives: http://stackoverflow.com/questions/7487977/using-bitwise-or-0-to-floor-a-number
        	var tinyH = G.ctx.canvas.height * quality | 0;

        	//keep it from going beyond the container width (which causes problems in firefox: http://stackoverflow.com/questions/22985452/firefox-drawimage-tot-canvas-error-indexsizeerror-index-or-size-is-negative-or)
        	if (tinyW > G.ctx.canvas.width-1) {
        		//alert("bad: tinyW is "+tinyW+" and canvasWidth is "+G.ctx.canvas.width);
        		tinyW = G.ctx.canvas.width;
        		//alert("but that's OK because tinyW is now "+tinyW+" and canvasWidth is "+G.ctx.canvas.width);
        	}
        	if (tinyH > G.ctx.canvas.height-1) {
        		tinyW = G.ctx.canvas.height;
        	}

        	//console.log(G.ctx);
        	G.ctx.drawImage(G.img, 0, 0, tinyW, tinyH);
        	//alert(G.ctx.canvas.width);
        	//console.log(tinyW+" "+tinyH+" "+G.ctx.canvas.width+" "+G.ctx.canvas.height);
        	G.ctx.drawImage(G.ctx.canvas, 0, 0, tinyW, tinyH, 0, 0, G.ctx.canvas.width, G.ctx.canvas.height);

		}

		function addInteractivity() {

			//remove 300ms delay on mobile: https://github.com/ftlabs/fastclick
			//FastClick.attach(document.body);

			$("#pause").click(function(e) {
				/*
				$(this).toggleClass("active");

				if ($("#pause").hasClass("active")) {
					//pause it
					clearInterval(stepInterval);
				} else {
					//resume it
					startCountdown();
				}
				 */

				//alert('next');
				//nextSlide();

			});
			$(".answer").click(function(event) {
				event.preventDefault();
				//debugger;
				if (G.okToGuess == true) {

					//make this false, so you can't guess again during the transitions to the next slide
					G.okToGuess = false;

					//stop the countdown
					clearInterval(stepInterval);

					//reveal the actual image
					paintImage(G.finalQuality);

					//after a delay, move to the next slide
					setTimeout(function(){
						nextSlide();
					}, G.nextSlideDuration);

					// for logging - NOTE These are DOM-dependent
					var $this = $( this );
					// actual answer text
					var answer = $this.text();
					// current slide id
					var slideId = $this.parents( '.slide' ).attr( 'id' );


					if ($(this).hasClass("correct")) {

						//add the winner class to this button
						$(this).addClass("winner");

						//Calculate the score to show in the nav bar and success state
						G.pointsSoFar = G.pointsSoFar+G.potentialPoints;
						G.pointsSoFarForDisplay = Math.round(G.pointsSoFar);

						G.potentialPointsForDisplay = Math.round(G.potentialPoints);

						//show the success state
						showFeedback("correct", G.potentialPointsForDisplay);

						logEvent( { type: 'answered question', attrs: { slide: slideId, answer: answer, correct: 'correct', score: G.potentialPointsForDisplay } } );

						//populate the score in the nav
						var scoreOutput = "";
						scoreOutput = G.pointsSoFarForDisplay+" / "+G.totalPoints;
						$(".score").html("Score: "+scoreOutput);

						//var finalTime = $('.stopwatch').html();
						//var moves = $('.moves').html();
						//clearInterval(sharpenInterval);
						//clearInterval(t);
						//paintImage(1);
						//alert("Success! You finished the puzzle in "+finalTime+" seconds with "+moves+" and "+answersText);
						//nextSlide();

					} else {
						//add the loser class to this button...
						$(this).addClass("loser");

						//..then mark the correct button
						$(".answer.correct").addClass("winner");

						//deduct the points for a wrong guess
						//NOTE: No more point deductions for a wrong guess
						//G.pointsSoFar = G.pointsSoFar-G.pointsPerSlide;
						G.pointsSoFarForDisplay = Math.round(G.pointsSoFar);
						//populate the score in the nav
						var scoreOutput = "";
						scoreOutput = G.pointsSoFarForDisplay+" / "+G.totalPoints;
						$(".score").html("Score: "+scoreOutput);


						//show the feedback text
						showFeedback("incorrect");

						logEvent( { type: 'answered question', attrs: { slide: slideId, answer: answer, correct: 'incorrect', score: 0 } } );

						//alert("Incorrect!");
						//G.wrongAnswers++;
					}

				} /*end if OK to guess*/

			});
		}

		function nextSlide() {
			//fade out current slide
			$("#slide-"+G.currentSlide).fadeOut(function(){
				//after fading out current slide, load the next slide
				//debugger;
				if (G.currentSlide < G.slides.length-1) {
					G.currentSlide++
					loadSlide(G.currentSlide);
				} else {
					//alert("that's the end!");
					showEndScreen();
				}

			});
		}

		function showEndScreen() {
			var content = '';
			content += '<div class="score-recap">';
			content += '<span class="header">Final Score:</span><span class="large">'+G.pointsSoFarForDisplay+" / "+G.totalPoints+'</span>';
			//content += '<span class="header">[Share Icons]</span>';
			content += '<span class="header"><a class="answer" href="" onClick="window.opener.location.reload(false);">Try Again</a></span>';
			//content += '<span class="header"><a class="answer" href="/demos/pixelate4/">Play Another</a></span>';
			content += '</div>';
			$("#container").append(content);
			$(".score-recap").fadeIn();
			// rudimentary tracking
			logEvent( { type: 'completed', attrs: { final_score: G.pointsSoFarForDisplay, max_final_score: G.totalPoints } } );
		}

		function showFeedback(answer, scoreForDisplay) {
			var content = '';
			if (answer == "correct") {
				content += '<span class="correct-holder"><span class="correct">Correct!</span><span class="points">+'+scoreForDisplay+' Points</span></span>';
			} else if (answer == "incorrect") {
				content += '<span class="incorrect-holder"><span class="incorrect">Incorrect!</span><span class="points">0 Points</span></span>';
			}

			$("#slide-"+G.currentSlide).append('<div class="feedbacktext">'+content+'</div>');

			//$("#slide-"+G.currentSlide).append('<div class="feedbacktext"><span class="correct-holder"><span class="correct">Correct!</span><span class="points">+45 Points</span></span><span class="incorrect-holder"><span class="incorrect">Incorrect!</span><span class="points">+45 Points</span></span></div>');

			//make the success states huge: https://github.com/davatron5000/FitText.js
			var canvasHeight = G.ctx.canvas.height;
			$(".feedbacktext").height(canvasHeight);
			$(".feedbacktext .correct, .feedbacktext .incorrect").fitText(.7);
			$(".feedbacktext .points").fitText();
			//debugger;
			setTimeout(function(){
				$(".feedbacktext ."+answer+"-holder").fadeOut(1000);
			}, G.successFadeOutDelay);
			/*
			$(".feedbacktext ."+answer+"-holder").css("opacity",1);
			//then fade it out after a few moments
			//debugger;

			*/
		}



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

		function sharpen() {
			if (G.maxQuality < .9) {
				G.maxQuality = G.maxQuality * 1.1;
			} else {
				G.maxQuality = .98;
				clearInterval(sharpenInterval);
			}
			console.log(G.maxQuality);
			paintImage(G.maxQuality*100, "yes");
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

		// abstract out how we're doing events
		function logEvent( data ) {
			$( window ).trigger( gameEventName, data );
		}
	}

	// track events
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
			// console.log( { eventType: eventType, attributes: attributes, metrics: metrics } );
			if ( eventType == 'completed' ) {
				console.log( 'done' );
				mobileAnalyticsClient.submitEvents();
			}
		}
	});
});

var gameEventName = "game:puzzle";
