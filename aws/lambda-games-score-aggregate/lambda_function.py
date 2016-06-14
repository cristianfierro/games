from __future__ import print_function

import json
import boto3
import operator
import decimal
from boto3.dynamodb.conditions import Key, Attr

print('Loading function')


def lambda_handler(event, context):
    #print("Received event: " + json.dumps(event, indent=2))
    changes = {}
    for record in event['Records']:
        changedata = record['dynamodb']
        gameid = changedata['Keys']['gameid']['S']
        print( gameid );
        if gameid in changes:
            changes[ gameid ] += 1
        else:
            changes[ gameid ] = 1;
    
    dynamodb = boto3.resource( 'dynamodb', region_name='us-east-1' )
    table = dynamodb.Table( 'games-scores-dev' )
    s3_bucket_name = 'rtheriault-test'
    s3 = boto3.resource('s3')

    for gameid in changes:
        print( "Updating " + gameid + " with " + str(changes[ gameid ]) + " updates" )
        # fetch records from DynamoDB

        response = table.query(
            KeyConditionExpression=Key('gameid').eq( gameid )
        )
        
        stats = {}
        
        scores = {}
        scorekeys = []
        for i in response['Items']:
            score = str( i['score'] )
            scores[ score ] = i['scorecount']
            scorekeys.append( i['score'] )

        scorekeys.sort()
            
        print( scores )
        print( scorekeys )
        
        # to KISS we're just creating a list of scores with frequency
        total = 0 # number of game plays
        totalscores = 0 # accumlation of scores for averaging
        maxscore = 0
        stats['bins'] = {}
        for scorekey in scorekeys:
            score = str( scorekey )
            stats['bins'][ score ] = {}
            stats['bins'][ score ]['count'] = scores[ score ]
            total += scores[ score ]
            totalscores += scores[ score ] * scorekey
            stats['bins'][ score ]['cumulative'] = total
            maxscore = max( scores[ score ], maxscore )
        
        stats['max'] = maxscore
        stats['total'] = total
        stats['average'] = totalscores / total
        
        # and now we're filling in any gaps, plus creating the normalized stats
        # count = raw frequency
        # cumulative = raw frequency at or lower
        # normal = normalized frequency from 0 to 1 (reflecting max bin)
        # position = "bell-curved" (simply) what % of scores are at or below this one?
        all = range( 0, 101 )
        dist = 0
        cumulative = 0
        for scoreint in all:
            score = str( scoreint )
            if scoreint in scorekeys:
                cumulative = stats['bins'][ score ]['cumulative']
                dist = cumulative / total * 100
                stats['bins'][ score ]['normal'] = stats['bins'][ score ]['count'] / maxscore
            else:
                # gap-filling
                stats['bins'][ score ] = {}
                stats['bins'][ score ]['cumulative'] = cumulative
                stats['bins'][ score ]['count'] = 0
                stats['bins'][ score ]['normal'] = 0
                
            stats['bins'][ score ]['position'] = dist
                
        
        # now save to S3
	stats_json = json.dumps( stats, sort_keys=True, indent=4, separators=(',', ': '), default=decimal_default )

	# note to self, do not start with /, it seems to stash stuff in a folder named ''
	object_key = 'scores/' + gameid + '.json'
	print( object_key )
        s3response = s3.Object( s3_bucket_name, object_key ).put( Body=stats_json, ACL='public-read', ContentType='application/json' )
	print( s3response )


    return 'Successfully processed {} records.'.format(len(event['Records']))


def decimal_default(obj):
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    raise TypeError
