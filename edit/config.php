<?php

// GAMES EDITOR config handler

// AWS API whines without this
date_default_timezone_set('America/New_York');
require 'vendor/autoload.php';

define( 'AWS_REGION', 'us-east-1' );

// put site-specific settings in the Editor config
$configJSON = file_get_contents( dirname( __FILE__ ) . '/config.json' );
$settings = json_decode( $configJSON, true );

// Deploy assets to S3
if ( isset( $settings['AWS']['S3BucketProd'] ) ) {
	define( 'AWS_BUCKET_PROD', $settings['AWS']['S3BucketProd'] );
}
define( 'AWS_BUCKET_STAGE', $settings['AWS']['S3BucketStage'] );
// track in DynamoDB
define( 'DYNAMO_TABLE', $settings['AWS']['DynamoTable'] );

// Fastly CDN (for purges)
if ( isset( $settings['Fastly'] ) ) {
	define( 'FASTLY_PROD', $settings['Fastly']['CdnProd'] );
	define( 'FASTLY_STAGE', $settings['Fastly']['CdnStage'] );
}
// TODO HIPS CDN

use Aws\Credentials\CredentialProvider;
// keep this in /home/www/games, TODO specify in config.json
$credpath = '/home/www/games/credentials.ini';

$provider = array();
foreach ( $settings['AWS']['profiles'] as $asset => $profile ) {
	$provider[ $asset ] = CredentialProvider::ini( $profile, $credpath );
	$provider[ $asset ] = CredentialProvider::memoize( $provider[ $asset ] );
}

$uploadDir = '/edit/uploads/';
$imageDir = '/images/';
$dataDir = '/data/';
