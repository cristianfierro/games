var State = require("../../State");
var DraggableTile = require("../../DraggableTile");
var _ = require("lodash");

class Playing extends State {
	constructor(context, settings, host) {
		super(context);
		this._host = host;
		this._settings = settings;
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
					<span class="score">Matches: 0</span>
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
				this.resizeBoard(this._$header.outerHeight(true));
				this._$header.slideDown();
				this.startStopwatch();
				this.context.analytics.record("Game Started");
			});
		});


		this._$board = $(".board", this._$template);
		this._$coincidences = $(".score", this._$template);
		this._$timer = $(".time", this._$template);

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
			window.open(`http://www.twitter.com/share?url=${encodeURI(window.top ? document.referrer : window.location.href)}&amp;text=I%20solved%20the%20puzzle%20in%20${this._$timer.text()}!&amp;via=Hearst`, 'Facebook Share', 'copyhistory=no');
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

		/* subscribe to events */
		$.subscribe("/tile/drag", this.onDrag.bind(this));
		$.subscribe("/tile/drag/end", this.onDragEnd.bind(this));
		this._elapsedTime = 0;
		this.context.analytics.record("Game Loaded");
	}
	go() {
		this.reset();

		let col = 0, row = 0, tiles = [];

		//we get the first image, this image will be sliced
		if (!this._image) {
			this._image = this.context.loader.getAsset(this._settings.slides[0]);
			this.setupTilesFromImage(this._image.image);
		}

		let limit = 0, diff = 0;
		//tries to shuffle the slides until a combination with more than 3 missplaced tiles is found, this will abort after 20 unsuccessfull tries

		//NOTE: this is slightly different that the method used on rearrange: this._settings.slides is an array of objects instead of strings
		while (limit < 20) {
			limit += 1;
			tiles = _.shuffle(this._settings.slides);
			//diff = number of slides that matches the winning condition
			diff = _.reduce(tiles, (sum, value, key) => value.id == this._settings.win[key] ? ++sum : sum, 0);
			if (diff <= 3) {
				break;
			}
		}
		let board_width = this._settings.tileWidth * this._settings.maxColumns;
		let board_height = this._settings.tileHeight * this._settings.maxRows;

		_.forEach(tiles, (item) => {
			let tile = new DraggableTile(col, row, item.id, "", item.url, this._settings.tileWidth, this._settings.tileHeight);
			tile.bgX = item.x;
			tile.bgY = item.y;
			tile.setStyles({ "background-size": `${board_width}px ${board_height}px`, "background-position": `${item.bx}px ${item.by}px`});
			this._tiles.push(tile);
			this._$board.append(tile.template());

			col++;
			if (col >= this._settings.maxColumns) {
				col = 0;
				row++;
			}
		});
		//the header is hidden, so the extra space on the board is only 1px
		this.resizeBoard(0);

		this.validateWinningCondition();
		//this.startStopwatch();
		this._$template.removeClass("hidden").hide().fadeIn();
		this._$uiblocker.fadeIn();

	}
	resizeBoard(extra) {

		if (extra || extra === 0) {
			this._extraHeight = extra;
		}

		let boardH = this._settings.maxRows * this._settings.tileHeight;
		this._$template.css({width: "100%", height: boardH + this._extraHeight + "px"});
	}

	reset() {
		this._draggedTile = null;
		this._draggedTileIndex = null;

		this._isMovingTiles = false;
		this._dropTarget = null;
		this._stopwatch = null;

		this._steps = 0;
		this._seconds = 0;
		this._minutes = 0;
		this._hours = 0;

		if (this._stopwatch) {
			clearTimeout(this._stopwatch);
			this._$timer.html("00:00:00");
		}
		this._tiles.length = 0; //well supported and performant way of clearing an array
		this._$board.empty();
	}
	setupTilesFromImage(img) {
		this._settings.slides.length = 0;
		this._settings.win.length = 0;
		let x = 0, y = 0;
		let board_width = this._$template.width();
		let board_height = img.height * (board_width / img.width);
		this._settings.tileWidth = board_width / this._settings.maxColumns;
		this._settings.tileHeight = board_height / this._settings.maxRows;
		for (let i = 0; i < this._settings.maxColumns * this._settings.maxRows; i++) {
			this._settings.slides.push({
				id: "image" + i,
				url: img.src,
				bx: x * this._settings.tileWidth * -1,
				by: y * this._settings.tileHeight * -1,
				x: x,
				y: y
			});
			this._settings.win.push("image" + i);
			x++;
			if (x >= this._settings.maxColumns) {
				x = 0;
				y++;
			}
		}
	}
	disableTiles() {
		_.forEach(this._tiles, (tile) => tile.disable());
	}
	enableTiles() {
		_.forEach(this._tiles, (tile) => tile.enable());
	}

	resize() {
		this._$board.empty();

		let board_width = this._$template.width();
		let board_height = this._image.image.height * (board_width / this._image.image.width);
		this._settings.tileWidth = board_width / this._settings.maxColumns;
		this._settings.tileHeight = board_height / this._settings.maxRows;


		for (let i = 0; i < this._tiles.length; i++) {
			var posx = i % this._settings.maxColumns;
			var posy = (i - posx) / this._settings.maxColumns;
			this._tiles[i].updateCoordinates(posx, posy);
			this._tiles[i].resize(this._settings.tileWidth, this._settings.tileHeight);
			this._tiles[i].setStyles({ "background-size": `${board_width}px ${board_height}px`, "background-position": `${this._tiles[i].bgX * this._settings.tileWidth * -1}px ${this._tiles[i].bgY * this._settings.tileHeight * -1}px`});

			this._$board.append(this._tiles[i].template());
		}

		this.resizeBoard();
	}

	onDrag(e, tile) {
		var result = _.findIndex(this._tiles, (o) => tile.hitTest(o, "50%"));
		if (result >= 0) {
			tile.dropTarget = result;
		} else {
			tile.dropTarget = null;
		}
	}

	onDragEnd(e, tile) {
		if (tile.dropTarget != null) {
			this._isMovingTiles = true;
			var index = _.findIndex(this._tiles, (o) => o._id == tile._id);

			var dropx = index % this._settings.maxColumns;
			var dropy = (index - dropx) / this._settings.maxColumns;

			var tilex = tile.dropTarget % this._settings.maxColumns;
			var tiley = (tile.dropTarget - tilex) / this._settings.maxColumns;

			let finishedDropAnimation = false, finishedTileAnimation = false;

			this._tiles[tile.dropTarget].moveToCanvasCoordinates(dropx, dropy, () => {
				finishedDropAnimation = true;
				if (finishedTileAnimation) {
					this._tiles[index] = this._tiles[tile.dropTarget];
					this._tiles[tile.dropTarget] = tile;
					this._isMovingTiles = false;
					this.validateWinningCondition();
				}
			});
			this._tiles[index].moveToCanvasCoordinates(tilex, tiley, () => {
				finishedTileAnimation = true;
				if (finishedDropAnimation) {
					this._tiles[index] = this._tiles[tile.dropTarget];
					this._tiles[tile.dropTarget] = tile;
					this._isMovingTiles = false;
					this.validateWinningCondition();
				}
			});
			this._steps++;

		} else {
			tile.returnToOrigin();
		}
	}
	startStopwatch() {
		this._stopwatch = setTimeout(() => {
			this._elapsedTime++;
			this._seconds++;
			if (this._seconds >= 60) {
				this._seconds = 0;
				this._minutes++;
				if (this._minutes >= 60) {
					this._minutes = 0;
					this._hours++;
				}
			}
			this._$timer.html(`${(this._hours ? (this._hours > 9 ? this._hours : "0" + this._hours) : "00")}:${(this._minutes ? (this._minutes > 9 ? this._minutes : "0" + this._minutes) : "00")}:${(this._seconds > 9 ? this._seconds : "0" + this._seconds)}`);

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

		this._$coincidences.html(`Matches: ${score}`);
		if (this._tiles.length == score) {
			if (this._stopwatch) {
				clearTimeout(this._stopwatch);
			}
			this.showFeedback();
		}

	}
	showFeedback() {
		this.disableTiles();
		this.context.analytics.record("Puzzle Solved", null, { puzzle_time: this._elapsedTime });
		this.context.analytics.submit();

		$(".dd-time-amount", this._$template).html(this._$timer.html());
		this.resizeBoard(this._$winstate.outerHeight(true));
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
