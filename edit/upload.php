<?php
// save upload into subdirectory "uploads"
// TODO prevent harmful uploads - permitted images only, safe file extensions & names

// root is one up from here
$rootDir = dirname( dirname( __FILE__) );
$targetPath = '/edit/uploads/';
 
if ( !empty( $_FILES ) ) {
	$tempFile = $_FILES['file']['tmp_name'];
	$targetFile =  $targetPath . $_FILES['file']['name'];
	move_uploaded_file( $tempFile, $rootDir . $targetFile );
}
die( $targetFile );
