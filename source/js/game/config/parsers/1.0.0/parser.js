var _ = require("lodash");


/**
 * Parser: This class is used to parse json configurations and output something common that PuzzleGame can understand. So this
 *  will act as an adapter pattern. This will future-proof cases in which the json file changes so that the old configuration
 *  files can still be used without having to update them.
 */
class Parser {


	/**
	 * translate - Receives a Json config object and translates it insto something that the game can use
	 *
	 * @param  {Object} json The original json configuration for the game, with version number = 1.0.0
	 * @return {Object}      The digested and transformed configuration object.
	 */
	translate(json) {
		// This is how the configuration object should look in the end (more or less).
		//
		// Why i do this?
		// 		In the current configuration the slides attribute is an object with multiple objects, but the ECMASCRIPT standard specifies that the order of the
		// 		properties is not quaranteed when read. By 'convention' all browsers read the properties in the order on which they were createad, but they dont have to in order
		// 		to be compliant with ECMASCRIPT, so it is more like a gentleman's courtesy that they do that. I don't like that an important functionality of the game depends
		// 		on something that is a convention instead of a standard so i stubbornly changed all those parts of the config in which order has some degree of relevance
		// 		to array objects.
		//
		// Why a resources property?
		// 		Because of the Image Preloader mechanism. On the original json configuration the resources are spread all over the configuration file with different names
		// 		but in order for the Preloader to load all the images BEFORE the game starts i need them all in a predictable place, so i move them all to the resources.images
		// 		or resources.sounds (planning to the future) properties and reference them by id from the options in output.settings.custom. This way i can mix the images
		// 		for the buttons with the images of the tiles and the image of the splash screen all in the same place.
		let output = {
			id: json.id,
			gametype: json.gametype,
			settings: {
				resources: {
					images: [],
					sounds: []
				},
				custom: {
					challenge: json.challenge,
					slides: [],
					win: []
				}
			}
		};
		_.forOwn(json.slides, (value, key) => {
			output.settings.resources.images.push(_.assign({ id: key }, value));
			output.settings.custom.slides.push(key);
			//This is only necessary if the gametype is unscramble or rearrange
			output.settings.custom.win.push(key);
		});
		if (json.settings) {
			_.assign(output.settings.custom, json.settings);
		}
		if (json.answers) {
			output.settings.custom.answers = {};
			_.assign(output.settings.custom.answers, json.answers);
		}

		return output;
	}
}

module.exports = Parser;
