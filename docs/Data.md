Data

"Data" is a json file containing the resources and settings needed for the game.

```json
{
    "id": "cat",
    "config_version": "1.0.0",
    "gametype": "pixels",
    "slides": {
        "image1": {
            "width": 1600,
            "height": 1067,
            "crop": {
                "width": 1334,
                "height": 1067,
                "left": 0,
                "top": 0,
                "url": "\/images\/cat\/image1-crop.jpg"
            },
            "url": "\/images\/cat\/cats-1.jpg",
            "answers": [
                {
                    "caption": "Dog",
                    "correct": false
                },
                {
                    "caption": "Cat",
                    "correct": true
                }
            ]
        }
    },
    "challenge": "Identify the cat"
}
```

The essential components are
* id - the slug
* config_version - used for forward compatibility
* gametype - a keyword that identifie the game engine used
* challenge - a label describing the game, not currently used publicly
* slides - a list of slides and their attributes

Optionally
* settings - if present represents certain game settings per-game

Slides
* url - links to the original uploaded image
* width - the original width
* height - the original height
* crop - a structure containing 4 values representing the crop width, height, top and left corner. Optionally, url represents an actual crop used when HIPS is off

Slide Options
* each slide may have additional attributes, for example above, "answers" is a list of possible answers, with the correct answer identified
* caption - text to display below the slide

