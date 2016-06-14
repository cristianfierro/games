<?php
require_once( 'config.php' );
use Aws\DynamoDb\DynamoDbClient;

$dynamodb = new DynamoDbClient( array(
	'region' => AWS_REGION,
	'version' => 'latest',
	'credentials' => $provider['DynamoDB']
	) );

$scan = $dynamodb->scan([
	'TableName' => DYNAMO_TABLE
]);

$list = array();
foreach ( $scan['Items'] as $key => $value ) {
	$id = $value['Id']['S'];
	$type = $value['Gametype']['S'];
	$challenge = $value['Challenge']['S'];
	$list[ $id ] = array(
		'id' => $id,
		'gametype' => $type,
		'challenge' => $challenge,
		'thumbnail' => '/images/' . $id . '/thumbnail.jpg',
	);
}

die( json_encode( $list ) );
