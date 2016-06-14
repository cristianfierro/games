var Tools = {
	getQueryVariable: function(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		for (var i=0, len = vars.length; i < len; i++) {
			var pair = vars[i].split('=');
			if (pair[0] == variable) {
				return pair[1];
			}
		}
	},
	guessMediaCategory: function(width) {
		if (width <= 320) {
			return 'xs';
		}
		if (width <= 480) {
			return 'sm';
		}
		if (width <= 768) {
			return 'md';
		}
		if (width <= 992) {
			return 'lg';
		}
		if (width <= 1200) {
			return 'xg';
		}
	},
	//easing function: http://stackoverflow.com/a/8317722/1399181
	//cheat sheet: http://easings.net/
	//easing code: https://github.com/danro/jquery-easing/blob/master/jquery.easing.js

	linear: function(percent, elapsed, start, end) {
		return start + (end - start) * percent;
	},
	easeOutQuad: function(x, t, b, c, d) {
		return -c * (t/=d) * (t-2) + b;
	},
	easeInQuad: function(x, t, b, c, d) {
		return c * (t/=d) * t + b;
	},
	easeInCubic: function(x, t, b, c, d) {
		return c * (t/=d) * t * t + b;
	},
	easeInQuart: function(x, t, b, c, d) {
		return c * (t/=d) * t * t * t + b;
	},
	easeInSine: function(x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeInCirc: function(x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeInElastic: function(x, t, b, c, d) {
		var s=1.70158, p = 0, a = c;
		if (t == 0) return b;
		if ((t/=d) == 1) return b + c;
		if (!p) p = d * .3;
		if (a < Math.abs(c)) {
			a = c;
			var s = p / 4;
		} else {
			var s = p / (2 * Math.PI) * Math.asin(c/a);
		}
		return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	},
	//Adapted from jQuery.fitText: https://github.com/davatron5000/FitText.js
	fitText: function(target, kompressor, options) {
		var compressor = kompressor || 1;
		var settings = $.extend({
			'minFontSize' : Number.NEGATIVE_INFINITY,
			'maxFontSize' : Number.POSITIVE_INFINITY
		}, options);

		return $(target).each(function(){
			// Store the object
			var $this = $(this);

			// Resizer() resizes items based on the object width divided by the compressor * 10
			var resizer = function () {
				$this.css('font-size', Math.max(Math.min($this.width() / (compressor*10), parseFloat(settings.maxFontSize)), parseFloat(settings.minFontSize)));
			};

			// Call once to set.
			resizer();

			// Call on resize. Opera debounces their resize by default.
			$(window).on('resize.fittext orientationchange.fittext', resizer);
		});
	}
};

module.exports = Tools;
