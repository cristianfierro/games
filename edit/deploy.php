<?php
// deployment handler for Games Editor
require_once( 'config.php' );

use Aws\S3\S3Client;
use Aws\DynamoDb\DynamoDbClient;
// TODO use Guzzle\Http\Client as GuzzleClient;

// TODO caclulate this based on the determined rows and cols
// thumbs are 300 x 160
$thumbMap = array(
	'rearrange' => array(
		'1' => array( 0, 0, 100, 80 ),
		'2' => array( 100, 0, 100, 80 ),
		'3' => array( 200, 0, 100, 80 ),
		'4' => array( 0, 80, 100, 80 ),
		'5' => array( 100, 80, 100, 80 ),
		'6' => array( 200, 80, 100, 80 ),
		),
	'unscramble' => array(
		'1' => array( 0, 0, 300, 160 ),
		),
	'pixels' => array(
		'1' => array( 0, 0, 300, 160 ),
		),
	);
// TODO settings file
$maxSlides = array(
	'rearrange' => 6,
	'unscramble' => 1,
	'pixels' => 100,
	);

// list of files to deploy to S3
$files = array();

$json = file_get_contents( 'php://input' );
$game = json_decode( $json, true );
$gamedata = $game['data'];
// remove the slides, they'll be added in the loop
$gamedata['slides'] = array();
$env = $game['type'];

if ( isset( $_POST['action'] ) ) {
	if ( $_POST['action'] == 'delete' ) {
		$game_id = $_POST['gameId'];
		deleteGame( $game_id );
	}
}

$id = trim( preg_replace( "/[^a-zA-Z0-9\-_]+/", "", $game['data']['id'] ) );
if ( ! $id ) {
	error_die( 'invalid id' );
}
$gamedata['id'] = $id;
$datafile = $dataDir . $id . '.json';
$imageDir = $imageDir . $id . '/';
// root is one directory up from this "edit" directory
$rootDir = dirname( dirname( __FILE__ ) );
if ( ! is_dir( $rootDir . $imageDir ) ) {
	if ( !  mkdir( $rootDir . $imageDir, 0777, true ) ) {
		error_die( 'unable to create directory ' . $imageDir );
	}
}

$type = $gamedata['gametype'];
$thumb = imagecreatetruecolor( 300, 160 );

// move and update images
$imageCount = 0;
foreach ( $game['data']['slides'] as $imageId => $image ) {
	// if image is not in image dir, move or copy it to image dir
	$currentPath = $image['url'];
	if ( ! $currentPath ) {
		error_log( $imageId . ' has no url' );
		continue;
	}
	if ( $imageCount >= $maxSlides[ $type ] ) {
		break;
	}
	// copy the slide into the final version
	$gamedata['slides'][ $imageId ] = $image;

	$currentPath = moveFromUploads( $currentPath );
	$gamedata['slides'][ $imageId ]['url'] = $currentPath;
	$imageCount++;

	// insert thumbnail TODO use crop info
	if ( $map = $thumbMap[ $type ][ $imageCount ] ) {
		$filename = $rootDir . $currentPath;
		$source = imageCreateFromAny( $filename );
		list( $srcWidth, $srcHeight ) = getimagesize( $filename );
		if ( isset( $image['crop'] ) ) {
			$crop = $image['crop'];
		} else {
			$crop = array(
				'width' => $srcWidth,
				'height' => $srcHeight,
				'left' => 0,
				'top' => 0,
				);
		}
		imagecopyresized( $thumb, $source,
			$map[0], $map[1], // dest x, y
			$crop['left'], $crop['top'], // source x, y
			$map[2], $map[3], // dest w, h
			$crop['width'], $crop['height'] );
	}

	// add to S3 list
	// lets do all files for now, TODO only changed files
	$files[ $currentPath ] = $rootDir . $currentPath;
	// deploy crop if it exists
	if ( isset( $image['crop']['url'] ) ) {
		$cropPath = $image['crop']['url'];
		$cropPath = moveFromUploads( $cropPath );
		$files[ $cropPath ] = $rootDir . $cropPath;
	}
}

// save thumbnail and add to file list
$thumbPath = $imageDir . 'thumbnail.jpg';
imagejpeg( $thumb, $rootDir . $thumbPath );
$files[ $thumbPath ] = $rootDir . $thumbPath;

// save data file
file_put_contents( $rootDir . $datafile, json_encode( $gamedata, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT ) );
// todo this would make sense as a method one day, addS3( $datafile )
$files[ $datafile ] = $rootDir . $datafile;
// TODO split $purge into hips and cdn and be selective
$purge = array_keys( $files );
if ( 'prod' == $env ) {
	$fileSent = sendToS3( $files, AWS_BUCKET_STAGE );
	$fileSent = sendToS3( $files, AWS_BUCKET_PROD );
	if ( defined( 'FASTLY_PROD' ) ) {
		purgeFastly( $purge, FASTLY_PROD );
		purgeFastly( $purge, FASTLY_STAGE );
		// TODO hips and separate json from images
	}
} else if ( 'stage' == $env ) {
	$fileSent = sendToS3( $files, AWS_BUCKET_STAGE );
	if ( defined( 'FASTLY_STAGE' ) ) {
		purgeFastly( $purge, FASTLY_STAGE );
	}
} else {
	$fileSent = "updated in " . $env;
}

// default challenge if not set
$challenge = 'game ' . $id . ' of type ' . $type;
if ( isset( $gamedata['challenge'] ) ) {
	$challenge = $gamedata['challenge'];
}

// update DynamoDB
// TODO create a method
$dynamodb = new DynamoDbClient( array(
	'region' => AWS_REGION,
	'version' => 'latest',
	'credentials' => $provider['DynamoDB']
	) );

	$item = [
		'TableName' => DYNAMO_TABLE,
		'Item' => [
			'Id'           => ['S'      => $id      ], // Primary Key
			'Gametype'     => ['S'      => $type ],
			'Challenge'    => ['S'      => $challenge ],
// TODO include status, ie if last deployed  to prod, "published", and possibly version
		]
	];
$response = $dynamodb->putItem( $item );

json_die( $gamedata, $fileSent );

//----------------- LIBS ---------------

/*
 * move image from uploads or other dir to id-based dir
 *
 * @uses globals $rootDir, $imageDir // TODO instance vars and methods
 * @param string $currentPath path to file
 * @return string new path
 */
function moveFromUploads( $currentPath ) {
	global $rootDir, $imageDir;

	if ( FALSE === strpos( $imageDir, $currentPath ) ) {
		$filename = basename( $currentPath );
		if ( ! $filename ) {
			// uh-oh, can't move this
			error_log( 'no filename for ' . $currentPath );
			continue;
		}
		$imagePath = $imageDir . $filename;

		// copy from old to new dir; TODO move?
		copy( $rootDir . $currentPath, $rootDir . $imagePath );
		$currentPath = $imagePath;
	}
	return $currentPath;
}

function error_die( $error ) {
	die( json_encode( array( 'error' => $error ) ) );
}
function json_die( $data, $files ) {
	$response = json_encode( array( 'success' => 'done',
		'id' => $data['id'],
		'gamedata' => $data,
		'deployed' => $files
		), JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT );
	die( $response );
}

// copy stuff to S3
function sendToS3( $list, $bucket ) {
	global $provider;

	// Instantiate an Amazon S3 client.
	$s3 = new S3Client( array(
		'region' => AWS_REGION,
		'version' => 'latest',
		'credentials' => $provider['S3']
		) );

	$sent = array();
	foreach ( $list as $key => $filename ) {
		try {
			$s3->putObject([
				'Bucket' => $bucket,
				'Key'    => ltrim( $key, '/' ),
				'Body'   => fopen( $filename, 'r' ),
				'ACL'    => 'public-read',
			]);
			$sent[] = $key;
		} catch ( Aws\Exception\S3Exception $e ) {
			error_log( 'upload error for ' . $key );
		}
	}
	return $sent;
}
// see http://php.net/manual/en/function.imagecreatefromjpeg.php
function imageCreateFromAny($filepath) {
	$type = exif_imagetype($filepath); // [] if you don't have exif you could use getImageSize()
	$allowedTypes = array(
		1,  // [] gif
		2,  // [] jpg
		3,  // [] png
		6   // [] bmp
		);
	if (!in_array($type, $allowedTypes)) {
		return false;
	}
	switch ($type) {
	case 1 :
		$im = imageCreateFromGif($filepath);
		break;
	case 2 :
		$im = imageCreateFromJpeg($filepath);
		break;
	case 3 :
		$im = imageCreateFromPng($filepath);
		break;
	case 6 :
		$im = imageCreateFromBmp($filepath);
		break;
	}
	return $im;
}

function purgeFastly( $files, $domain ) {
	$guzzle = new GuzzleHttp\Client();
	foreach ( $files as $file ) {
		$url = $domain . $file;
		try {
			$res = $guzzle->request( 'PURGE', $url );
		} catch ( Exception $e ) {
			error_log( 'purge error for ' . $url );
		}
	}
}

// deletes game from gallery by removing DB entry and game assets
function deleteGame( $game_id ) {
	global $provider;

	$dynamodb = new DynamoDbClient( array(
		'region' => AWS_REGION,
		'version' => 'latest',
		'credentials' => $provider['DynamoDB']
	) );

	$response = $dynamodb->deleteItem([
		'TableName' => DYNAMO_TABLE,
		'Key' => [
			'Id' => [
				'S' => $game_id
			]
		]
	]);

	if ( $response['@metadata']['statusCode'] == '200' ) {
		// delete data file
		$json_data_path = dirname(__DIR__) . '/data/' . $game_id . '.json';
		if ( is_file( $json_data_path ) ) {
			unlink( $json_data_path );
		}
		// delete image asset directory and files
		$image_dir_path = dirname( __DIR__ ) . '/images/' . $game_id;
		$asset_files = glob( $image_dir_path . '/*' );
		foreach ( $asset_files as $each_asset_file ) {
			if ( is_file( $each_asset_file ) )
				unlink( $each_asset_file );
		}
		rmdir( $image_dir_path );

		die( json_encode( $response['@metadata']['statusCode'] ) );
	} else {
		die( json_encode( $response ) );
	}

}

