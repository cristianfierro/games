var HRSTGAME_ANALYTICS = {
	// these defaults correcpond to DEV "Vote Test" Cognito pool and "puzzles-dev-test" Analytics ID
	region: "us-east-1",
	poolId: "us-east-1:d6c9520c-a236-463b-9c1f-cfebe9c279e0",
	appId: "b0f861b3dd194738b5af686a512eead4",
	appTitle: "Hearst Games - development",
	appVersionName: "0.0.2",
	appVersionCode: "20160527",
	kinesisStreamName: "games-stream-dev"
};
$.getJSON("/localsettings.json", function(data) {
	HRSTGAME_ANALYTICS.region = data.region;
	HRSTGAME_ANALYTICS.poolId = data.poolId;
	HRSTGAME_ANALYTICS.appId = data.appId;
	HRSTGAME_ANALYTICS.appTitle = data.appTitle;
	HRSTGAME_ANALYTICS.appVersionName = data.appVersionName;
	HRSTGAME_ANALYTICS.appVersionCode = data.appVersionCode;
	HRSTGAME_ANALYTICS.kinesisStreamName = data.kinesisStreamName;
}).fail(function() {
	console.log("Cognito Identity File not found, using development Configuration");
}).always(function(){
	AWS.config.region = HRSTGAME_ANALYTICS.region; // Region
	AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: HRSTGAME_ANALYTICS.poolId
	});
	// get the credentials now
	AWS.config.credentials.get();
	// instantiate the Mobile Analytics Manager, see https://github.com/aws/aws-sdk-mobile-analytics-js - b0f861b3dd194738b5af686a512eead4
	var analytics_options = {
		appId : HRSTGAME_ANALYTICS.appId,
		// enable next line ONLY for debugging
		// logger: console,
		appTitle: HRSTGAME_ANALYTICS.appTitle,
		appVersionName: HRSTGAME_ANALYTICS.appVersionName,
		appVersionCode: HRSTGAME_ANALYTICS.appVersionCode
	};

	var mobileAnalyticsClient = new AMA.Manager( analytics_options );
	var starttime = null;

	// listen for analytics events
	// general record event
	$(window).on( "analytics:record", function(event, gametype, gameid, message, values, client_metrics) {
		if ( typeof mobileAnalyticsClient == "object" ) {
			var attributes = {};
			var metrics = {};

			attributes.gametype = gametype;
			attributes.gameid = gameid;
			attributes.embedsite = ( window !== parent ) ? document.referrer : window.location.href;
			starttime = starttime || Date.now();
			metrics.elapsed = Date.now() - starttime;

			if (values) {
				$.extend(attributes, values);
			}

			if (client_metrics) {
				$.extend( metrics, client_metrics );
			}

			mobileAnalyticsClient.recordEvent(message, attributes, metrics);
		}
	});
	// submit data if in the buffer
	$(window).on("analytics:submit", function(){
		mobileAnalyticsClient.submitEvents();
	});

	var kinesisClient = new AWS.Kinesis();
	// special case - send certain events to Kinesis
	$(window).on( "analytics:record", function( event, gametype, gameid, message, values, client_metrics ) {
		if ( typeof kinesisClient == "object" ) {
			if ( message == "Game Completed" ) {
				var userId = AWS.config.credentials.identityId;
				var payload = {
					'user': userId,
					'game': gameid,
					'score': values.final_score
				};
				var params = {
					Data: JSON.stringify( payload ),
					PartitionKey: gameid,
					StreamName: HRSTGAME_ANALYTICS.kinesisStreamName
				};
				kinesisClient.putRecord( params, function( err, data ) {
					if ( err ) {
						console.log( err, err.stack );
					} else {
						console.log( data );
					}
				});
			}
		}
	});
});
