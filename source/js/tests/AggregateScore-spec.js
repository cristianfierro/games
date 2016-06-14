/* eslint-disable */
/* globals describe, it, expect, before */
describe("AggregateScore class specifications.", () => {
	let AggregateScore, invalidAggregateScore, aggregateScore;
	beforeAll(() => {
		AggregateScore = require("../game/AggregateScore");
		invalidAggregateScore = new AggregateScore('random-id');
		spyOn($, 'getJSON').and.callFake((url, success) => {
			success(
				{
					"bins": {
						"0": {
							"count": 3.0,
							"cumulative": 3.0,
							"normal": 1.0,
							"position": 33.333333333333336
						},
						"1": {
							"count": 0,
							"cumulative": 3.0,
							"normal": 0,
							"position": 33.333333333333336
						}
					},
					"max": 3.0,
					"total": 9.0,
					"average": 78.0
				}
			);
			return {
				fail: function() {}
			}
		});
		aggregateScore = new AggregateScore('scores-test-file');
	});
	it("getAggregateScore() should return an empty object if scores json file doesn't exists", () => {
		expect(invalidAggregateScore.getAggregateData()).toEqual({});
	});
	it("getAggregateScore() should return empty object if scores json file doesn't exists", () => {
		expect(invalidAggregateScore.getAggregateScore(1)).toEqual({});
	});
	it("getAverageScore() should return 0 if scores json file doesn't exists", () => {
		expect(invalidAggregateScore.getAverageScore()).toEqual(0);
	});
	it("getAggregateScore() shouldn't return an empty object if scores json file exists", () => {
		let data = aggregateScore.getAggregateData();
		expect(data.bins).toBeDefined();
		expect(data.max).toBeDefined();
		expect(data.total).toBeDefined();
		expect(data.average).toBeDefined();
	});
	it("getAggregateScore() shouldn't return empty object if scores json file exists", () => {
		let agregate_score = aggregateScore.getAggregateScore(1);
		expect(agregate_score.count).toBeDefined();
		expect(agregate_score.cumulative).toBeDefined();
		expect(agregate_score.normal).toBeDefined();
		expect(agregate_score.position).toBeDefined();
	});
	it("getAverageScore() shouldn't return 0 if scores json file exists", () => {
		expect(aggregateScore.getAverageScore()).not.toEqual(0);
	});
});
