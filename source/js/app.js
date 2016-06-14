//TODO: make a real documentation
/* isolate from global namespace with a self executed function expression */
(function() {
	"use strict";

	var PuzzleGame = require("./game/PuzzleGame");
	var Tools = require("./game/Tools");
	/**
	 * Game Bootstrapper
	 */
	//TODO: make this options customizable via $.extend
	var puzzle = null;

	function init() {
		var game = Tools.getQueryVariable("game");
		var host = Tools.getQueryVariable("site");
		if (game) {
			puzzle = new PuzzleGame(window, document);
			puzzle.start("#container", game, host);
		}
	}

	init();
})();
