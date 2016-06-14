/* eslint-disable */
describe("PuzzleGame class specifications", () => {
	let game = null;
	beforeAll(() => {
		let PuzzleGame = require('./PuzzleGame');
		let fixture = $(`
			<section id="hearst-game-container">
		        <div id="loader-wrapper">
		        </div>
		        <div id="container">
		        </div>
		    </section>
		`);
		$('body').append(fixture);
		game = new PuzzleGame(window, document);
		spyOn($, 'getJSON').and.callFake((url, success) => {
			success(
				{
				    "id": "GoT-Deaths",
				    "config_version": "1.0.0",
				    "gametype": "rearrange",
				    "slides": {
				        "image6": {
				            "width": 980,
				            "height": 490,
				            "crop": {
				                "width": 569,
				                "height": 454,
				                "left": 187,
				                "top": 36,
				                "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
				            },
				            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
				            "caption": "Ned Stark"
				        },
				        "image4": {
				            "width": 614,
				            "height": 345,
				            "crop": {
				                "width": 431,
				                "height": 345,
				                "left": 92,
				                "top": 0,
				                "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
				            },
				            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
				            "caption": "Robb Stark"
				        },
				        "image2": {
				            "width": 980,
				            "height": 490,
				            "crop": {
				                "width": 613,
				                "height": 490,
				                "left": 340,
				                "top": 0,
				                "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
				            },
				            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
				            "caption": "King Joffrey"
				        },
				        "image1": {
				            "width": 374,
				            "height": 597,
				            "crop": {
				                "width": 374,
				                "height": 299,
				                "left": -2,
				                "top": 21,
				                "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
				            },
				            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
				            "caption": "Oberyn Martell"
				        },
				        "image5": {
				            "width": 374,
				            "height": 576,
				            "crop": {
				                "width": 374,
				                "height": 299,
				                "left": -1,
				                "top": 15,
				                "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
				            },
				            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
				            "caption": "Tywin Lannister"
				        },
				        "image3": {
				            "width": 1600,
				            "height": 800,
				            "crop": {
				                "width": 1000,
				                "height": 800,
				                "left": 300,
				                "top": 0
				            },
				            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
				            "caption": "Jon Snow"
				        }
				    },
				    "challenge": "Put these GoT Characters in Order of their Death"
				}
			);
			return {
				fail: function() {}
			}
		});
	});
	it("should add 'default' class to body if site is wired to be localhost.", () => {
		game.start('#container', 'rearrange', 'localhost');
		expect($('body')).toHaveClass("default");
	});
	it("should add 'cosmopolitan' class to body if site is wired to be cosmopolitan.", () => {
		game.start('#container', 'rearrange', 'localhost');
		expect($('body')).toHaveClass("default");
	});
	it("should add 'esquire' class to body if site is wired to be esquire.", () => {
		game.start('#container', 'rearrange', 'localhost');
		expect($('body')).toHaveClass("default");
	});
	it("should add 'elle' class to body if site is wired to be elle.", () => {
		game.start('#container', 'rearrange', 'localhost');
		expect($('body')).toHaveClass("default");
	});
	it("the container should not be empty and be Visible.", () => {
		game.start('#container', 'rearrange', 'localhost', (err) => {
			expect(err).toBeUndefined();
			expect($('#container')).not.toBeEmpty();
			expect($('#container')).toBeVisible();
			expect($('#loader-wrapper')).not.toBeVisible();
		});
	});
});
