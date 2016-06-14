<?php

// edit stub for games

?><!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="//code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css">
	<link rel="stylesheet" type="text/css" href="/edit/css/dropzone.css"/>
	<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet" media="all">
	<link rel="stylesheet" type="text/css" href="/edit/css/cropper.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">
	<link href="//cdnjs.cloudflare.com/ajax/libs/bootstrap-slider/7.0.0/css/bootstrap-slider.css" rel="stylesheet" media="all">

	<link rel="stylesheet" type="text/css" href="/edit/css/games-edit.css"/>
	<link rel="icon" href="/favicon.ico">
	<title>Interactive Content Builder - Hearst Magazines Digital Media</title>
</head>
<body role="document">

    <!-- Fixed navbar -->
    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a data-mode="main" class="page-mode editnav-main navbar-brand" href="#"><img class="shadowfilter" id="games-logo" src="images/hearst-games.png" alt="Interactive Content Builder"/></a>
        </div>
        <div id="navbar" class="navbar-collapse collapse">
          <ul class="nav navbar-nav">
            <li class="editnav-gallery"><a role="tab" class="page-mode" data-mode="gallery" href="#gallery">Game Gallery</a></li>
            <li class="editnav-create"><a role="tab" class="page-mode" data-mode="create" href="#create">Create A Game</a></li>
          </ul>
          <ul class="nav navbar-nav navbar-right">
            <li>
              <a class="share-clip" id="share-go-clip" data-toggle="tootip" data-container="body" data-placement="auto bottom"
			title="Click to copy a link to your clipboard that loads this game and tab" href="#">
			<span class="glyphicon glyphicon-link" aria-hidden="true"></span> Share Link
              </a>
            </li>
          </ul>
        </div><!--/.nav-collapse -->
      </div>
    </nav>
	<div id="page-topper">&nbsp;</div>
	<nav class="nav">
		<div class="enable-create container">
			<ul id="navTabs" class="nav nav-pills">
				<li class="active"><a role="tab" data-toggle="tab" href="#new">Create New</a></li>
				<li ><a role="tab" data-toggle="tab" href="#editor">Editor</a></li>
				<li><a role="tab" data-toggle="tab" href="#player">Player</a></li>
			</ul>
		</div>
	</nav>
	<div id="main-html" class="container enable-main">
	</div>
	<div class="container" id="alerts">
	</div>
	<div id="games" class="container enable-gallery">
		<div class="row" id="game-list-container">
		</div>
	</div>
<div class="container tab-content enable-create">
	<div class="container" id="alerts">
	</div>
	<div role="tabpanel" class="tab-pane active" id="new">
		<div class="row">
			<div class="col-sm-6 col-md-4">
				<div class="thumbnail">
					<img src="images/unscramble.png" alt="unscramble puzzle">
					<div class="caption">
						<h3>Unscramble Puzzle</h3>
						<p>One image or gif is cut into pieces and shuffled. A player must unscramble the pieces to reveal the photo. Score is based on time.</p>
						<p>
							<a href="#" class="action btn btn-primary" data-command="new" data-new-type="unscramble" role="button">Create New Unscramble</a>
							<a href="http://themix.hearst.com/tag/unscramble/" class="action btn btn-default" target="_blank" role="button">See Examples
							<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>
							</a>
						</p>
					</div>
				</div>
			</div>
			<div class="col-sm-6 col-md-4">
				<div class="thumbnail">
					<img src="images/rearrange.png" alt="rearrange puzzle">
					<div class="caption">
						<h3>Rearrange Puzzle</h3>
						<p>Create an ordered list of images such as "Arrange George Clooney from youngest to oldest". The player will get a shuffled set and is timed on how fast they can rearrange them into the correct order. Score is based on time.</p>
						<p>
							<a href="#" class="action btn btn-primary" data-command="new" data-new-type="rearrange" role="button">Create New Rearrange</a>
							<a href="http://themix.hearst.com/tag/rearrange/" class="action btn btn-default" target="_blank" role="button">See Examples
							<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>
							</a>
						</p>
					</div>
				</div>
			</div>
			<div class="col-sm-6 col-md-4">
				<div class="thumbnail">
					<img src="images/pixels.png" alt="pixels puzzle">
					<div class="caption">
						<h3>Pixels Puzzle</h3>
						<p>Each photo is slowly revealed. As it depixelates, players identify the image by choosing from two or more answers. Correct guesses earlier score more points.</p>
						<p>
							<a href="#" class="action btn btn-primary" data-command="new" data-new-type="pixels" role="button">Create New Pixels</a>
							<a href="http://themix.hearst.com/tag/pixels/" class="action btn btn-default" target="_blank" role="button">See Examples
							<span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>

	</div>
	<div role="tabpanel" class="tab-pane" id="editor">
		<div>
			<div class="control"><strong>Game slug:</strong> <span data-game-attr="id"
				id="game-id" data-toggle="tooltip" data-placement="top" title="Click to edit the slug"></span></div>
			<div class="control"><strong>Type:</strong> <span id="game-type">
			</span></div>
			<div class="control">
				<span class="action action-push hvr-back-pulse hvr-icon-wobble-horizontal" data-command="deploy"><strong>Save / Publish</strong></span>
				<select id="deploy-type" data-toggle="tooltip" data-placement="top" title="Choose a destination">
					<!-- js will fill this in -->
				</select>
			</div>
		</div>
		<div id="game-settings">
			<div class="control"><strong>Challenge:</strong> <span data-game-attr="challenge"
				id="game-challenge" data-toggle="tooltip" data-placement="top" title="Click to edit the challenge">Rearrange the photos!</span></div>
		</div>
		<div id="edit-container" class="hearst-game-container sortable-images">
<?php
		// this is pretty much the only PHP, this file could be set up as a html file if needed
		for ( $i = 1; $i <= 1; $i++ ) {
?>
			<div id="image<?php echo $i; ?>" class="dd-slide editable-image">
				<div class="preview"></div>
				<span class="dropzone image-dropzone">
					<span class="dz-message"></span>
				</span>
				<span data-toggle="tooltip" title="Drag here to reorder" class="sort-handle"><span class="glyphicon glyphicon-move"></span></span>
				<span data-toggle="tooltip" title="Click to crop" class="crop-handle"><span class="glyphicon glyphicon-scissors"></span></span>
				<span data-placeholder="Caption_This" class="editable-caption dd-caption default">Caption_This</span>
			</div>
<?php
		}
?>
		</div>
	</div>
	<div role="tabpanel" class="tab-pane" id="player">
		<iframe width="100%" height="600" id="player-frame" class="no-margin" style="overflow:hidden;" frameborder="0" src=""></iframe>

		<div class="container">
			<button id="share-stage" type="button" class="btn btn-default share-clip" data-clipboard-text="" 
				title="Click to copy the stage share iframe to your clipboard">
				<span class="glyphicon glyphicon-copy" aria-hidden="true"></span> Copy Stage Embed Code
			</button>
			<button id="share-prod" type="button" class="btn btn-default share-clip" data-clipboard-text=""
				title="Click to copy the production share iframe to your clipboard">
				<span class="glyphicon glyphicon-copy" aria-hidden="true"></span> Copy Prod Embed Code
			</button>
		</div>
	</div>
</div>
<div id="crop-modal">
	<div id="modal-header">
		<div class="control">Image Cropper</div>
		<div class="control"><span class="modal-close hvr-back-pulse">close</span></div>
	</div>
	<div id="crop-container">
		<img class="croppable" id="image-cropper" src=""/>
	</div>
</div>
<!-- scripts -->
	<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
	<script src="//code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>

	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>
	<script src="//cdnjs.cloudflare.com/ajax/libs/bootstrap-slider/7.0.0/bootstrap-slider.min.js"></script>


	<script src="/edit/js/jquery.editable.js"></script>
	<script src="/edit/js/dropzone.js"></script>
	<script src="/edit/js/cropper.js"></script>
	<script src="/edit/js/games-edit.js"></script>
	<script src="/edit/js/iframeResizer.min.js"></script>
	<script src="/edit/js/clipboard.min.js"></script>
</body>
</html>
