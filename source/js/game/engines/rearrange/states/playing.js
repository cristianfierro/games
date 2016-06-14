var State = require("../../State");
var DraggableTile = require("../../DraggableTile");
var _ = require("lodash");

class Playing extends State {
	constructor(context, settings, host) {
		super(context);
		this._settings = settings;
		this._host = host;
		this._tiles = [];

		this._$template = $(`
			<div class="puzzle hidden">
				<div class="dd-winstate inactive">
					<div class="dd-banner-success">Success! You solved the puzzle.</div>
					<div class="cf">
						<div class="dd-time">
							<div class="dd-winstate--message">Your Time:</div>
							<div>
								<span class="dd-time-amount">00:00:00</span>
							</div>
						</div>
						<div class="dd-social">
							<div class="dd-winstate--message">Challenge a Friend:</div>
							<div class="dd-social-links">
								<a href="" target="_blank" class="link-button facebook">
									<i class="dd-share-button--icon dd-icon-facebook"></i>
								</a>
								<a href="" target="_blank" class="link-button twitter">
									<i class="dd-share-button--icon dd-icon-twitter"></i>
								</a>
							</div>
						</div>
					</div>
				</div>
				<div class="ui-blocker">
					<span style="display: inline;" class="bigbutton" id="start">Start the Puzzle!</span>
				</div>
				<div id="header" class="inactive">
					<span class="score">0 out of X</span>
					<span class="time">00:00:00</span>
				</div>
				<div class="board"></div>
			</div>
		`);
		this._$winstate = $(".dd-winstate", this._$template);
		this._$uiblocker = $(".ui-blocker", this._$template);

		this._$header = $("#header", this._$template);
		this._$uiblocker.on("click", () => {
			this._$uiblocker.fadeOut(() => {
				this.resizeBoard(50);
				this._$header.slideDown();
				this.startStopwatch();
				this.context.analytics.record("Game Started");
			});
		});
		this._$board = $(".board", this._$template);
		this._$steps = $(".progress", this._$template);
		this._$coincidences = $(".score", this._$template);
		this._$timer = $(".time", this._$template);

		this._stopwatch = null;
		this._elapsedTime = 0;

		/* Adding share button click events */
		$("a.facebook", this._$template).on("click", (e) => {
			e.preventDefault();
			//
			//window.open(`https://www.facebook.com/sharer/sharer.php?app_id=0&amp;sdk=joey&amp;u=${escape(document.referrer)}&amp;display=popup&amp;ref=plugin&amp;src=share_button`);
			/*
			if (FB) {
				FB.ui(
				 {
				  method: 'share',
				  href: document.referrer,
				  quote: 'I solved the puzzle in ' + this._$timer.text() + '! can you?'
				}, function(response){
					//TODO: place a call to debugger here instead of using console.log
					//console.log(response);
				});
			}
			*/

			window.open(`https://www.facebook.com/sharer/sharer.php?app_id=${this._host.fb}&sdk=joey&u=${encodeURI(window.top ? document.referrer : window.location.href)}&display=popup&ref=plugin&src=share_button`, 'Facebook Share', 'copyhistory=no');
			return false;
		});
		$("a.twitter", this._$template).on("click", (e) => {
			e.preventDefault();
			window.open(`http://www.twitter.com/share?url=${encodeURI(window.top ? document.referrer : window.location.href)}&amp;text=I%20solved%20the%20puzzle%20in%20${this._$timer.text()}!&amp;via=Hearst`, 'Twitter Share', 'copyhistory=no');
			return false;
		});
		/*
		$("a.try-again", this._$template).on("click", (e) => {
			e.preventDefault();
			this._$winstate.slideUp(() => {
				this.go();
			});
		});
		*/
		/* subscribe events */
		$.subscribe("/tile/drag", this.onDrag.bind(this));
		$.subscribe("/tile/press", this.onPress.bind(this));
		$.subscribe("/tile/drag/end", this.onDragEnd.bind(this));
		$.subscribe("/tile/drag/start", this.onDragStart.bind(this));
		this.context.analytics.record("Game Loaded");

	}
	go() {
		this._canDrop = true;
		this._hasWon = false;
		this._isMakingRoom = false;
		this._draggedTile = null;
		this._draggedTileIndex = null;
		this._dropTarget = null;

		this._$uiblocker.fadeIn();
		this._steps = 0;
		this._$steps.html(`Steps: ${this._steps}`);

		this._seconds = 0;
		this._minutes = 0;
		this._hours = 0;

		if (this._stopwatch) {
			clearTimeout(this._stopwatch);
			this._$timer.html("00:00:00");
		}

		let col = 0, row = 0, tiles = [];
		this._tiles.length = 0; //well supported and performant way of clearing an array
		this._$board.empty();
		$(".feedbacktext", this._$template).hide();

		let limit = 0, diff = 0;
		//tries to shuffle the slides until a combination with more than 3 missplaced tiles is found, this will abort after 20 unsuccessfull tries

		while (limit < 20) {
			limit += 1;
			tiles = _.shuffle(this._settings.slides);
			diff = _.reduce(tiles, (sum, value, key) => value == this._settings.win[key] ? ++sum : sum, 0);
			if (diff <= 3) {
				break;
			}
		}

		_.forEach(tiles, (item) => {
			let asset = this.context.loader.getAsset(item);
			//console.log()
			let url = asset.crop.url ? asset.crop.url : asset.url;
			let tile = new DraggableTile(col, row, item, asset.caption, url, this._settings.tileWidth, this._settings.tileHeight, false);
			this._tiles.push(tile);
			this._$board.append(tile.template());

			col++;
			if (col >= this._settings.maxColumns) {
				col = 0;
				row++;
			}
		});
		DraggableTile.singleDrag = true;
		this.resizeBoard(1);

		this.validateWinningCondition();

		this._$template.removeClass("hidden").hide().fadeIn();
	}
	disableTiles() {
		_.forEach(this._tiles, (tile) => tile.disable());
	}
	enableTiles() {
		_.forEach(this._tiles, (tile) => tile.enable());
	}
	resizeBoard(extra) {

		if (extra) {
			this._extraHeight = extra;
		}

		let boardW = this._settings.maxColumns * this._settings.tileWidth;
		let boardH = this._settings.maxRows * this._settings.tileHeight;
		this._$board.css({width: boardW + "px", height: boardH + "px"});
		this._$template.css({width: boardW + "px", height: boardH + this._extraHeight + "px"});
	}
	resize(settings) {
		_.assign(this._settings, settings);
		this._$board.empty();

		for (let i = 0; i < this._tiles.length; i++) {
			var posx = i % this._settings.maxColumns;
			var posy = (i - posx) / this._settings.maxColumns;
			this._tiles[i].updateCoordinates(posx, posy);

			this._tiles[i].resize(this._settings.tileWidth, this._settings.tileHeight);
			this._$board.append(this._tiles[i].template());
		}
		this.resizeBoard();
	}
	onPress(e, tile) {
		if (!this._isDragging) {
			tile.enable();
		}
	}
	onDrag(e, tile) {
		if (!this._isMakingRoom && this._canDrop) {
			var result = _.filter(this._tiles, (h) => h).find((o) => tile.hitTest(o, "50%"));
			if (result) {
				this.makeRoom(result);
			}
		}
	}
	onDragStart(e, tile) {
		if (!this._isMakingRoom && this._canDrop) {
			this._draggedTileIndex = _.findIndex(this._tiles, (o) => o._id == tile._id);
			this._draggedTile = this._tiles[this._draggedTileIndex];
			this._tiles[this._draggedTileIndex] = null;
		}
	}

	onDragEnd(e, tile) {
		if (this._canDrop) {
			for (let i = 0, len = this._tiles.length; i < len; i++) {
				if (this._tiles[i] == null) {

					this._tiles[i] = this._draggedTile;
					this._draggedTile = null;
					this._draggedTileIndex = null;

					var posx = i % this._settings.maxColumns;
					var posy = (i - posx) / this._settings.maxColumns;
					this._tiles[i].moveToCanvasCoordinates(posx, posy);

					this._steps++;
					this._$steps.html(`Steps: ${this._steps}`);
					this.validateWinningCondition();
				}
			}
		} else {
			tile.returnToOrigin();
		}
	}
	makeRoom(target) {
		this._isMakingRoom = true;
		var index = _.findIndex(this._tiles, (o) => {
			if (!o) return null;
			return o._id === target._id;
		});
		var destinationIndexLeft = null;
		var destinationIndexRight = null;

		/* Note: by 'caching' the length the array is a little bit faster */
		for (let i = index, len = this._tiles.length; i < len; i++) {
			if (this._tiles[i] == null) {
				destinationIndexRight = i;
				break;
			}
		}

		for (let i = index; i >= 0; i--) {
			if (this._tiles[i] == null) {
				destinationIndexLeft = i;
				break;
			}
		}
		if (destinationIndexRight) {
			this.shiftTilesRight(index, destinationIndexRight);
		} else {
			this.shiftTilesLeft(index, destinationIndexLeft);
		}
	}
	shiftTilesRight(index, destinationIndex) {
		for (let i = destinationIndex - 1; i >= index; i--) {
			var posx = (i + 1) % this._settings.maxColumns;
			var posy = ((i + 1) - posx) / this._settings.maxColumns;
			this._tiles[i].moveToCanvasCoordinates(posx, posy, () => {
				this._isMakingRoom = false;
			});
			this._tiles[i + 1] = this._tiles[i];
			this._tiles[i] = null;
		}
	}
	shiftTilesLeft(index, destinationIndex) {
		for (let i = destinationIndex + 1; i <= index; i++) {
			var posx = (i - 1) % this._settings.maxColumns;
			var posy = ((i - 1) - posx) / this._settings.maxColumns;
			this._tiles[i].moveToCanvasCoordinates(posx, posy, () => {
				this._isMakingRoom = false;
			});
			this._tiles[i - 1] = this._tiles[i];
			this._tiles[i] = null;
		}
	}

	startStopwatch() {
		this._stopwatch = setTimeout(() => {
			this._seconds++;
			this._elapsedTime++;
			if (this._seconds >= 60) {
				this._seconds = 0;
				this._minutes++;
				if (this._minutes >= 60) {
					this._minutes = 0;
					this._hours++;
				}
			}
			this._$timer.html(`<strong>${(this._hours ? (this._hours > 9 ? this._hours : "0" + this._hours) : "00")}:${(this._minutes ? (this._minutes > 9 ? this._minutes : "0" + this._minutes) : "00")}:${(this._seconds > 9 ? this._seconds : "0" + this._seconds)}</strong>`);

			this.startStopwatch();

		}, 1000);
	}
	validateWinningCondition() {

		let score = 0;
		let _actualOrder = _.map(this._tiles, (x) => x ? x._id : this._draggedTile._id);
		for (let i = 0, len = _actualOrder.length; i < len; i++) {
			if (_actualOrder[i] === this._settings.win[i]) {
				score++;
			}
		}

		this._$coincidences.html(`${score} of ${_actualOrder.length}`);

		if (this._tiles.length == score) {
			if (this._stopwatch) {
				clearTimeout(this._stopwatch);
			}
			this.showFeedback();
		}

	}
	showFeedback() {
		//cheap trick so the user does not keep playing after winning
		this.disableTiles();
		this.context.analytics.record("Puzzle Solved", null, { puzzle_time: this._elapsedTime });
		this.context.analytics.submit();
		this._canDrop = false;
		$(".dd-time-amount", this._$template).html(this._$timer.html());
		this.resizeBoard(113);
		this._$winstate.slideDown(() => {
			this._$header.slideUp();

			$({deg: 0}).animate({deg: 1440}, {
				duration: 1000,
				step: (now) => {
					$(".dd-banner-success", this._$winstate).css({transform: 'rotateX(' + now + 'deg)'});
				}
			});

		});
	}



}

module.exports = Playing;
