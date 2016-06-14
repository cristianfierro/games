/**
* Adapter Pattern: The Adapter design pattern allows otherwise incompatible classes to work together
*     by converting the interface of one class into an interface expected by the clients. So this
*     will read the version of the json config, dynamically require it, and transform it into something
*     that PuzzleGame will be able to use. This is to future-proof json config changes.
*/
class ConfigAdapter {
	/**
	 * constructor - description
	 *
	 * @param  {Debuger}        debuggerConsole The instantiated debugger that PuzzleGame uses.
	 * @return {ConfigAdapter}                  A configuration adapter that will allow to transform a json config into something the game can understand
	 */
	constructor(debuggerConsole) {
		this._debugger = debuggerConsole;
	}


	/**
	 * translate - Takes up a json configuration and outputs a configuration format that PuzzleGame knows
	 *
	 * @param  {json} json     The Json file that will be read by this class, it is required that it has a 'config_version' attribute.
	 * @param  {type} callback The callback function that will be called when the json transformation is complete. This function needs to have the format that is commonly used on nodejs apps.
	 */
	translate(json, callback) {
		//callback with nodejs' error handling convention
		let Parser = null;
		try {
			Parser = require("./parsers/" + json.config_version + "/parser");
			callback(null, new Parser().translate(json));
		}
		catch (e) {
			let error = { message: "Error: Config Parser not Found!", stacktrace: e };
			this._debugger.log(error.message);
			callback(error, null);
		}
	}
}
module.exports = ConfigAdapter;
