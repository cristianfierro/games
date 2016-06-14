/* global describe, beforeAll,  it,  expect   */
describe("Buckets game Specifications.", () => {
	let loader, engine, config, container;
	let red = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
	let blue = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
	beforeAll(() => {
		/* this is what the config parser should output after it reads the json file */
		let BucketsEngine = require("./index.js");
		let AssetsLoader = require("../../mocks/AssetsLoader");

		container = $(`<div id="container"></div>`);
		loader = new AssetsLoader();

		config = {
			id: "buckets",
			gametype: "buckets",
			settings: {
				resources: {
					images: [
						{
							id: "image1",
							answer: "a",
							width: 980,
							height: 490,
							crop: {
								width: 735,
								height: 490,
								left: 123,
								top: 0
							},
							url: blue
						},
						{
							id: "image2",
							answer: "a",
							width: 980,
							height: 490,
							crop: {
								width: 735,
								height: 490,
								left: 123,
								top: 0
							},
							url: red
						},
						{
							id: "image3",
							answer: "b",
							width: 980,
							height: 490,
							crop: {
								width: 735,
								height: 490,
								left: 123,
								top: 0
							},
							url: blue
						},
						{
							id: "image4",
							answer: "b",
							width: 980,
							height: 490,
							crop: {
								width: 735,
								height: 490,
								left: 123,
								top: 0
							},
							url: red
						}
					],
					sounds: []
				},
				custom: {
					randomizeOrder: "yes",
					showSplashscreen: false,
					slideduration: 3,
					challenge: "Challenge Title",
					slides: [ "image1", "image2", "image3", "image4" ],
					win: [ "images", "image2", "image3", "image4" ],
					answers: {
						a: {
							image: {
								width: 1600,
								height: 1200,
								crop: {
									width: 1600,
									height: 1067,
									left: 0,
									top: 67
								},
								url: "/images/kanye/kanye2.jpg"
							},
							title: "A",
							description: "NO, not designed by Kanye"
						},
						b: {
							image: {
								width: 1600,
								height: 1200,
								crop: {
									width: 1600,
									height: 1067,
									left: 0,
									top: 67
								},
								url: "/images/kanye/kanye2.jpg"
							},
							title: "B",
							description: "YES, designed by Kanye"
						}
					}

				}
			}
		};
		loader.processQueue(config.settings.resources);
		engine = new BucketsEngine(container, loader, config);
	});
	it("when the game starts, there should not be any feedback divs present", () => {
		engine.start(() => {
			expect($('.west .answer .feedback').length).toEqual(0);
			expect($('.east .answer .feedback').length).toEqual(0);
		});
	});
	it("the pile must have exactly 4 cards on it", () => {
		engine.start(() => {
			expect($(".pile .card", container)).toHaveLength(4);
		});
	});
	it("initial status should be 0 out of 4 correct", () => {
		engine.start(() => {
			expect($(".status", container)).toHaveText("0 out of 4 Correct");
		});
	});
	it("the challenge should have text", () => {
		engine.start(() => {
			expect($(".challenge", container)).toContainText("Challenge Title");
		});
	});
	it("should have 2 option buttons", () => {
		let options = $('.options', container);
		expect(options).toContainElement('.option-a');
		expect(options).toContainElement('.option-b');

	});

	describe("Cards Actions", () => {
		it("should reduce the pile of cards by 1 after clicking on the left button", () => {
			engine.start(() => {
				expect(engine.states["playing"]._cards.length).toEqual(4);

				engine.states["playing"].onClick({ data: { direction: "left" }});
				expect(engine.states["playing"]._cards.length).toEqual(3);
			});
		});
		it("should reduce the pile of cards by 1 after clicking on the right button", () => {
			engine.start(() => {
				expect(engine.states["playing"]._cards.length).toEqual(4);

				engine.states["playing"].onClick({ data: { direction: "right" }});
				expect(engine.states["playing"]._cards.length).toEqual(3);
			});
		});
	});

});
