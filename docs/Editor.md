The editor 

The editor is mostly JS with a supporting initial set of html.

The editor handles all the UI manipulation with AJAX used to make changes to resources, currently served via PHP/Apache
* upload images
* save and deploy the data file and images to the server and S3, and create a thumbnail and update a DB list of games
* crop an image (supports feature-flagged HIPS when HIPS is off)
* obtain a list of games

In the future these duties may be handled by AWS Lambda functions or direct access to S3 and DynamoDB from JS.
