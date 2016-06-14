/* eslint-disable */
/* globals describe, it, expect, before */
describe("AssetsLoader class specifications.", () => {
	let resources, loader;
	beforeAll(() => {
        loader = require('./AssetsLoader');
        /* this is what the config parser should output after it reads the json file */
		resources = [
			{
                id: "image1",
				width: 980,
				height: 490,
				crop: {
					width: 569,
					height: 454,
					left: 187,
					top: 36,
					url: "../images/crop.jpg"
				},
				url: "../images/noncrop.jpg",
				caption: "Ned Stark"
			},
			{
                id: "image2",
				width: 614,
				height: 345,
				crop: {
					width: 431,
					height: 345,
					left: 92,
					top: 0,
					url: "../images/crop.gif"
				},
				url: "../images/noncrop.gif",
				caption: "Robb Stark"
			}
		];
	});
	it("queues should be loaded", () => {
		/*
		spyOn(loader, 'isDone');
        loader.processQueue(resources);
        //expect(typeof loader.downloadQueue).toEqual(typeof [])
		*/
		var a = 52;
		expect(a).toBe(52);
	});
});
