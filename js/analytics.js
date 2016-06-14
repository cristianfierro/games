// analytics and Cognito identity for game scores
// NOTE these are DEV ids - the Production ids will need to be generated into this file in the future
//
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
	IdentityPoolId: 'us-east-1:d6c9520c-a236-463b-9c1f-cfebe9c279e0',
	});

var hearstGameType = hearstGameType || 'unknown';

// instantiate the Mobile Analytics Manager, see https://github.com/aws/aws-sdk-mobile-analytics-js
var analytics_options = {
	appId : 'b0f861b3dd194738b5af686a512eead4',
	// game info here - TODO obtain by passed params
	// enable next line ONLY for debugging
	// logger: console,
	appTitle: 'Hearst game testing ' + hearstGameType,
	appVersionName: '0.0.1',
	appVersionCode: '20160407'
	};

// this should be a global var, will be used in game code to generate custom events
var mobileAnalyticsClient = new AMA.Manager( analytics_options );

