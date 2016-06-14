# hearst games

Hearst Community Games and Interactive Content Builder

## Requirements

### Requirements - Development
* PHP 5.5+
* AWS SDK
* Access to AWS console to create resources and users
* npm
* Node.JS
* a working Apache server or similar

### Requirements - deployed games
* S3 bucket
* CDN in front of the bucket (optional, we support Fastly)

### Requirements - Interactive Content Builder
* PHP 5.5+
* AWS SDK
* working Apache server
* certain AWS resources (see below) and credentials for a limited-rights user

## How it works
Editors can [build game content](docs/Editor.md) and deploy them by accessing /edit/ when parts of this repo are served via Apache

The [game data](docs/Data.md) is saved in the /data/ directory (e.e. /data/game-slug.json) and supporting files in /images/game-slug/

When deployed, the files are sent to an S3 bucket that has the same structure. The S3 bucket is behind a CDN.

We are using an [iFrame in an article page](docs/Iframes.md) to insert a game, the iFrame is obtained from the editor

The iFrame points to a framework html in /dist with additional query params for the game slug and optionally, site id
e.g. /dist/games.iframe.html?game=cats&site=esquire

Developers will [create new game engines](docs/HearstPuzzleGameDocumentation.md) via JS and css code, and then deploy the bundled code to the /dist folder on the dev server and in S3.

## Developer Notes

### getting started
Pull the repo into a directory and set your local Apache server to serve that directory up (privately and securely).

To support the editor's upload of large images, add this to the server conf:
```php
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

For the edit server side code to work properly, these directories need to be writable by the web server:
* /edit/uploads/ - uploaded images land here
* /data/ - json files of deployed items are built here, id.json
* /images/ - deployed images are stored here in subdirectories named for the game id, eg /images/id/

These folders are in the repo but contain no files, they each have a gitignore so test data and images are never committed

To work on editor code, go to the edit directory in the shell and run `composer install`. 

To work on games code, follow the simple steps in the [engine docs](docs/HearstPuzzleGameDocumentation.md) which are basically to install node and npm and then run `npm install`

To work with the AWS resources, see [AWS docs on setting up](docs/AWS.md) a dev DynamoDB and S3 bucket and a IAM user with limited access to these.

### tracking events
We're firing a trigger from jquery on document, using a custom event with an object parameter. That can be tracked by other code in the iframe or parent page by registering a callback e.g.
```javascript
$( document ).on( "analytics:record", function( event, messsage ) { etc... } );
```
Tracking messages are sent for page load, user starting the game, each move, finishing, and sharing.

AWS Mobile Analytics are enabled in the iFrame and listen for these messages to report events

### localsettings.json
Each S3 bucket hosting the games has a json configuration that is read by the client and is used to determine which Mobile Analytics, Cognito, and Kinesis resources to use

If a file is not present, the default is a development setting in the hdmdev account
To test locally, add a localsettings.json with different development settings, for example:
```javascript
{
	region: "us-east-1",
	poolId: "us-east-1:d6c9520c-a236-463b-9c1f-cfebe9c279e0",
	appId: "b0f861b3dd194738b5af686a512eead4",
	appTitle: "Hearst Games - development",
	appVersionName: "0.0.2",
	appVersionCode: "20160527",
	kinesisStreamName: "games-stream-dev"
}
```


### more to read
In case you missed the links above, we've documented the [data structure](docs/Data.md) and how the [Editor works](docs/Editor.md) and some details on generating the distributable [game files](docs/HearstPuzzleGameDocumentation.md)

