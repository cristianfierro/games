# Games Testing

Testbed for new Game Concepts. **WIP**

## Prerequisites

* NodeJS v5.3.x or superior
* npm v3.x or superior

## Installation

```bash
npm install
```

## Workflow

To run the development server:

```bash
npm start
```

or

```bash
npm run server
```

This will start a webpack-dev-server instance with the project root as the base folder of the server. To view the games in the web browser navigate to `http://localhost:8080/source`.

This will also run nodemon with a watch over `source/sass` and will automatically compile all sass files on change, but unlike changes on javascript files this will not reload the browser's page, so a manual reload is required.

To change which game is deployed to the server, modify the iframe route in `source/index.html` and replace `game=XXXX` where XXXX is the name of the json file in `/data` that has the configuration of the game.

The file `source/game.html` will need to be updated too. For example *rearrange* and *unscramble* games both use `tilegames.css` file to run, but *pixels* game needs `photos.css` instead. Both files are not compatible so their link references in `<head>` will need to be uncommented/commented out on `source/game.html` in order to run.

For Deployments please refer to the Deployment Section at the end of this document.

## A brief introduction to Webpack and Babel

*Disclaimer:* This documentation assumes that the reader has no prior knowledge of the latest Javascript tendencies. This way new developers can get up to date with these technologies if they don't know it.

[Webpack] is a module bundler, what does that mean? It basically takes modules with dependencies and generates static assets to represent those modules.

So we can have a module in a file `xxx.js` like:

```javascript
//xxx.js
import foo from './foo';

foo.bar();
```

And if we process it with _Webpack_, it will take this file, retrieve it's dependencies (foo.js) and generate a static file with both files.

So the idea with _Webpack_ is: We tell _webpack_ what the entry point is and _webpack_ figures out the rest. For some Javascript applications (like Angular), that is normally the file where we create our main module. So starting from that file, it starts pulling dependencies in (basically our entire application) and then it generates a `bundle.js` file which contains our application. There is no more need of creating hundreds of `<script>` tags anymore nor have a huge and very hard to debug single javascript file.

On the other hand we have _Babel_. [Babel] is a Javascript to javascript transpiler. Babel transforms next generation Javascript into a standard which all actual browsers support.

As it is said from the babel website:

> Babel has support for the latest version of Javascript through syntax transformers. These plugins allow you to use new syntax, **right now** without waiting for browser support.

For instance, you can use new language features like _Arrow Functions_ like so:

```javascript
[1,2,3].map(n => n + 1);
```

And get this javascript output:

```javascript
[1,2,3].map(function(n) {
    return n + 1;
});
```

Although in the source code you will find many of the new features of Ecmascript-6, some features are avoided on purpose due to it's actual status in the standard is not being fully approved. Some examples of these are Promises, Symbols and WeakMap/WeakSet.

You can find more information about all these new features in the [babel documentation][babeldocs]. I like to use this other [page][es6-features] as a quick lookup once i have learnt each new feature.

Through a webpack plugin, webpack will automatically transpile all the Ecmascript-6 javascript on it's compilation phase.

## Project Structure

* source
	* css
	* fonts
	* js
		* game
			* config
			* engines
	* sass
	* scripts
	* game.html
	* index.html

**Folder Descriptions:**

| Folder | Description |
|--------|-------------|
| css | This folder contains all the css/sass styles for the game |
| fonts | Contains the fonts to be used on the games |
| js | All the javascript files will be located in this folder |
| game | PuzzleGame class will be located in this folder. Please refer to the next section to know what this class will do. |
| config | This folder will have the config parsers. All data json files will be parsed by the config parser and will output a json file that all engines can understand |
| engines | The different game engines will be located here. Engines will reside on folders with the engine name, will contain a index.js  file with it's main functionality and will have a states folder with all the states of the game. |
| scripts | Additional scripts that will be included on index.html file. The scripts in this folder are either not found on npm or it's npm package doesn't work (which is the case for Greensock libraries) |
| game.html | This will be the container of each game and this is the file that will be called by the iframe |
|index.html | Placeholder page with an iframe for ease of development. |

## Code Structure

### Class Diagram

![Class Diagram][uml]

### Class Overview

| Class | Description |
|-------|-------------|
| PuzzleGame | Main class of the game. It's job is the loading of the assets and the initialization of the engines. It provides the _canvas_ to the Game Engine used. The _canvas_ is the html element in which the _game engine_ will draw itself. PuzzleGame is totally unaware of the inner workings of each Engine. (Encapsulation) |
| PubSub | This is not a class but a script, It was added to the documentation because it's role in the functionality of all the other classes is important. This script provides a Publication & Subscription message syndication mechanism to the game. A class subscribes to a topic and the subscribed function will be called every time another object publishes a message under that topic. This system is **very** simple and at the same time very **limited**. It takes advantage over jQuery's .on() and .off() methods to subscribe custom events on a Global object which will be used to deliver the messages. |
| BaseTile | This is the Base class for each type of Tile. Ideally this should be an abstract class but Javascript doesn't have nor needs those Object Oriented abstractions due to its dynamic nature |
| EngineContext | All engines must extend from this class. This class defines the basic methods that PuzzleGame will call to start the engine. This methods are start() and resize(). `start()` will tell the Engine that the assets has been loaded and that it can start the game. This class will also have methods to register and change states of a game. Please refer to the *States* entry on this table for more information  |
| State | This is the base class for all the States of the game. States can either be logical or graphical. If the state is graphical (has a template defined) the container's content will be detached and switched for the template element of the state being called. States will keep a reference of the Engine and expose public properties to some of the Engine's properties for ease of access. State class has three main methods: `go(...params)`, `nextState(id, ...params)` and `destroy(callback)`. The first method will be called after the state has been switched. The second method call be called from inside the state to change the current state of the game to the next one. Finally the last method will automatically be called whenever a state is switched off so the state can execute logic that should be done when the state is inactive. |
| DraggableTile | This class which extends BaseTile, represents those tiles that require Dragging to interact with them. Whenever a drag action is done it will emit an event via PubSub indicating which tile was affected |
| ClickableTile | This class which also extends BaseTile, represents a Tile which cannot be dragged. It's only possible interaction is by clicking on it. |
| RearrangeEngine | This class (which _'implements'_ the Engine _'interface'_) represents a Game of Ordering Elements by a topic. For instance: 'Order these movies by it's IMDB rating'. This class uses DraggableTile as its Tile representation and as it's main mean of interaction. The board behavior will be to make room to place a dragged tile whenever such tile is being dragged over another Tile on the board. This is the more complex Engine of all the initial engines of the project. |
| UnscrambleEngine | This engine is used for another type of Game. In this game a picture is sliced in several pieces and each piece is represented by a DraggableTile on the board. The board behavior will be very simple compared to OrderingEngine since it will only need to swap the positions of the dragged tile and the target tile. |
| PixelateEngine | This engine isn't Tile based like the previous three Engines and represents a game that shows a pixelated image and the user has to guess what is that images. |
| Analytics | This class provides shortcut methods to send information to AWS analytics |


### Thought Processes behind each initial Game Engine.

We will start explaining the Tile Based Engines.

Each of the Tile-based Engine has a property called `_tiles: Array`. This array will be an in-memory representation of the board and the Engine's job will be to try it's best to keep this in-memory representation of the board in sync with the graphical representation of it. Often times blocking user interactions until the animation process has been completed. Since this array has only one dimension I use a simple trick to transform this single dimension into a 2 dimensional array:

```javascript
//To represent Array[index] on the board:
var x_axis = index % _maxColumns;
var y_axis = (index - x_axis) / _maxColumns;
```

On a  10 columns x 3 rows board, the board will represented by an **Inverted Quadrant I Cartesian System** --meaning that the x increases from left to right and y increases from top to bottom-- and consequently the board will be divided like so:

| (0, 0) | (1, 0) | (2, 0) | (3, 0) | (4, 0) | (5, 0) | (6, 0) | (7, 0) | (8, 0) | (9, 0) |
|-------------------|
| (0, 1) | (1, 1) | (2, 1) | (3, 1) | (4, 1) | (5, 1) | (6, 1) | (7, 1) | (8, 1) | (9, 1) |
| (0, 2) | (1, 2) | (2, 2) | (3, 2) | (4, 2) | (5, 2) | (6, 2) | (7, 2) | (8, 2) | (9, 2) |

This system is similar to the one used to draw Windows on some, if not all, operating systems. By using the Formula above, an item at array index:

```javascript
// index 0, _maxColumns = 10
x = 0 % 10; //0
y = (0 - 0) / 10; //0
// array[0] -> (0, 0)
// index 7
x = 7 % 10; //7
y = (7 - 7) / 10; //0
// array[7] -> (7, 0)
// index 23
x = 23 % 10; //3
y = (23 - 3) / 10; //2
// array[23] -> (3, 2)
```

This way I can easily transform the array index to a XY axis coordinates. Since every tile will have the same width and the same height, i can position each element with `position: absolute;` and multiplying `x * _tileWidth` and `y * _tileHeight`.


## Deployment

To output the compiled and optimized final script, type this command on the terminal at the root folder:

```bash
npm run package
```

This is the sample configuration file which can be found on `build/configs/games.json`:

```javascript
{
	"games": [
		{
			"game": "games",
			"description": "General Games iFrame Page",
			"domain": "/dist",
			"css": [
			],
			"scripts": [
				"/scripts/Draggable.js",
				"/scripts/TweenLite.js"
			]
		}
	]
}
```

This setup will output a html file for each of the games in the `game.json` file. Each outputted html can have different css requirements or javascript libraries that the other games don't need, this way we can avoid side effects of incompatible libraries. Since the engines for each game are dynamically loaded and the css is embedded on runtime, there is no need to have more than one generated iframe.

# About EngineContext, State Management and How they work Together.

This is the code in `PuzzleGame.js` that will load each type of game:

```javascript
	//source/js/game/PuzzleGame.js
    let DynamicEngine = require("./engines/" + this._configuration.gametype + "/engine");
    this._engine = new DynamicEngine(this, this._configuration.settings);
```

Games are required dynamically. To create a new game you only need to do two things:

* Create a folder inside `source/js/game/engines` with the name of the game and a file named `engine.js` in that folder.
* Have `engine.js` define two methods:
	* `start(callback)`
	* `resize(callback)`

Those methods will both receive a callback function with no parameters that must be called when the methods have finished executing. PuzzleGame will call `start(callback)` of the game engine to let it know that it is ready to append it to the webpage and will wait until the callback is called to lift the loader animation and let the game begin:

```javascript
	//source/js/game/PuzzleGame.js
    this._engine.start(()=>{
        this._debug.log("Game Board has been Created!");
        this.startGameScreen(); //this method lifts the loading animation
    });
```

*__Note:__ Take notice that the callback function is binded to PuzzleGame, so `this` refers to PuzzleGame instead of the engine class (Thanks to the fat arrow syntax introduced in ES2015)*

This will give time to the game engine to prepare the html content and do initialization logic before the game is shown to the user. Similarly, `resize(callback)` will be called whenever the iFrame resizes so the game doesn't need to attach a listener to the window object and risk forgetting to remove it when the game is switched. As with `start(callback)`, PuzzleGame will wait until `resize`'s callback is called before continuing with it's job.

This means that as long as this requisites are met, a game engine doesn't need to inherit from `EngineContext`, but this class provides some helper methods to manage states from the game. Even so Engine Context's State Management is absolutely optional. You can still make a game without using any of it's helper methods as long as you override the methods mentioned above. State Management helps separate concerns in the game though, letting the game only have the necessary code to do what it needs to do. For instance:

If the game has a menu for different actions, like `join a room` or `select a card game` which then opens up another menu that has options like `solitaire`, `black jack`, `spider` (in the same engine), if we use a single file to store all this logic we will end up mixing the card game rules for `spider` with the rules for `solitaire`; Add to this the logic to manipulate the html to constantly add or remove menu screens and we end up with a very bloated and hard to mantain code. If we want to debug the `solitaire` portion of the game engine we would need to read through hundreds of lines of code to reach the part that interests us.

That's the reason for the States Management functionality of EngineContext: *to help with mantainability and scalability.*

Each state can call the next state and pass parameters to be used by the next state via the State's instance method `nextState(id, ...params)`. This method will pass all the parameters passed to it to the `go()` method of the next state. For example, using the card game situation from above, if we are on `menu` state and the user selected `freecell` as the card game that the user wants to play, then `menu` state could call the next state and pass any number of parameters like so: `nextState('freecell', username, 'another parameter', 25, ['one', 'two'])`. On the backstage EngineContext will detach the html of `menu` from the container and attach the html for `freecell` back into the container and then it will proceed to call `go('username variable value', 'another parameter', 25, ['one', 'two'])`.

EngineContext also exposes some convenience getters for commonly used objects like:

* `get container()` that returns the container as a jquery wrapped element.
* `get loader()` that returns the AssetsLoader class, and
* `get states()` which returns all the registered states.







[Webpack]: <https://webpack.github.io/>
[Babel]: <https://babeljs.io>
[babeldocs]: <http://babeljs.io/docs/learn-es2015/>
[es6-features]: <http://es6-features.org/>

[uml]: https://raw.githubusercontent.com/Hearst-Digital/games-testing/feature/readme/docs/images/puzzle-uml.png?token=ARR6NW0SU_gLCILm_vdm2U6O8m65czK7ks5XDVH7wA%3D%3D
