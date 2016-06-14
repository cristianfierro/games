/**
 @typedef AggregateScoreBin
 @type {Object}
 @property {number} count - # players with that score
 @property {number} cumulative - # players with that score or lower
 @property {number} normal - 0 to 1 normalized bin size compared to the max bin (for graphing)
 @property {number} position - Normalized percentage, this percent of users cored the same or lower.
 */

/**
 @typedef AggregateData
 @type {Object}
 @property {Object.<string, {AggregateScoreBin}>} bins - Object of AggregateScoreBin's
 @property {number} max - The highest value for any one point, useful if labelling a bar chart
 @property {number} total - The total number of datapoints or scores
 @property {number} average - The mean or average score
 */

/**
 * Aggregate Score Class
 * @class AggregateScore
 */
class AggregateScore {

	/**
	 * This constructor with receive the id of the game
	 * and it will query the scores file for that specific game
	 * @param id - id of the game
     */
	constructor(id) {
		this._data = {};

		$.getJSON( '/scores/' + id + '.json', ( data ) => {
			this._data = data;
		} );
	}

	/**
	 * Returns the aggregate score of a specific score
	 * @param {number} score - the final score
	 * @returns {{}|{AggregateScoreBin}} Aggregate Score or empty object
     */
	getAggregateScore(score){
		if (this._data.bins && this._data.bins[score]) {
			return this._data.bins[score];
		}
		return {};
	}

	/**
	 * Returns the average score of the game
	 * @returns {number} average score
     */
	getAverageScore(){
		return this._data.average ? Math.round(this._data.average) : 0;
	}

	/**
	 * Returns all the aggregate score data
	 * @returns {{}|{AggregateData}} Aggregate data or empty object
     */
	getAggregateData(){
		return this._data;
	}
}

module.exports = AggregateScore;
