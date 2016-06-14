
# AWS Setup

To deploy to S3, or to write to the DynamoDB table, the server needs access to AWS creds. Following the guidelines here:
https://docs.aws.amazon.com/aws-sdk-php/v3/guide/guide/credentials.html two profiles must be defined in the
directory above this repo, in a file named credentials.ini.
Profiles are games-dev and games-prod

Which profile is used is configured in the main editor config file, /edit/config.json
That file specifies the CDN URLs, S3 buckets, and Dynamo tables. It's read by config.php and also by the edit JS.

NOTE a sample config-sample-dev.json should be copied to config.json and edited appropriately.

Also, Amazon Mobile Analytics, a Cognito Identity Pool, and a Kinesis stream for score data are needed. These are configured in /localsettings.json

Some of the PHP scripts need the AWS SDK which is brought in via "composer install" (and requires PHP 5.5); that all happens in the edit directory.

