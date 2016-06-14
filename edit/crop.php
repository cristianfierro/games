<?php
require_once 'config.php';
// crop handler for Games Editor
// TODO use S3 exclusively
$max = array( 'width' => 1000, 'height' => 800 );

$json = file_get_contents( 'php://input' );
$data = json_decode( $json, true );

$id = trim( preg_replace( "/[^a-zA-Z0-9\-_]+/", "", $data['id'] ) );
if ( ! $id ) {
	error_die( 'invalid id' );
}
$response['id'] = $id;
$gameid = $data['gameid'];

$imageDir = $imageDir . $gameid . '/';
// root is one directory up from this "edit" directory
$rootDir = dirname( dirname( __FILE__ ) );

if ( ! is_dir( $rootDir . $imageDir ) ) {
	if ( !  mkdir( $rootDir . $imageDir, 0777, true ) ) {
		error_die( 'unable to create directory ' . $imageDir );
	}
}

$imageInfo = $data['image'];

// proportinately scale to max
$width = $imageInfo['crop']['width'];
$height = $imageInfo['crop']['height'];
if ( $width > $max['width'] ) {
	$height = intval( $height * $max['width'] / $width );
	$width = $max['width'];
}
if ( $height > $max['height'] ) {
	$width = intval( $width * $max['height'] / $height );
	$height = $max['height'];
}

$image = imagecreatetruecolor( $width, $height );

// if image is not in image dir, move or copy it to image dir
$currentPath = $imageInfo['url'];
if ( ! $currentPath ) {
	error_log( $imageId . ' has no url' );
	error_die( 'invalid image' );
}

// generate crop
$cropInfo = $imageInfo['crop'];
$filename = $rootDir . $currentPath;
$source = imageCreateFromAny( $filename );
list( $srcWidth, $srcHeight ) = getimagesize( $filename );
imagecopyresized( $image, $source,
		0, 0, // dest x, y
		$cropInfo['left'], $cropInfo['top'], // source x, y
		$width, $height, // dest w, h
		$cropInfo['width'], $cropInfo['height'] );

$cropPath = $imageDir . $id . '-crop.jpg';
imagejpeg( $image, $rootDir . $cropPath );
$response['url'] = $cropPath;

json_die( $response, $fileSent );

//----------------- LIBS ---------------

function error_die( $error ) {
	die( json_encode( array( 'error' => $error ) ) );
}
function json_die( $data ) {
	$response = json_encode( $data, JSON_NUMERIC_CHECK | JSON_FORCE_OBJECT );
	die( $response );
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

