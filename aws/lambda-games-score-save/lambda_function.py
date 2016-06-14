from __future__ import print_function

import boto3
import base64
import json

print('Loading function')

def lambda_handler(event, context):
    #print("Received event: " + json.dumps(event, indent=2))
    
    dynamodb = boto3.resource( 'dynamodb', region_name='us-east-1' )
    table = dynamodb.Table( 'games-scores-dev' )
            
    for record in event['Records']:
        # Kinesis data is base64 encoded so decode here
        payload = base64.b64decode( record['kinesis']['data'] )
        print( "Decoded payload: " + payload )

        # This is the payload we should receive from the Kinesis stream:
        # payload = '{ "user": "us-east-1:c9525c3a-851f-470e-b54a-2348eaf5780d", "game": "solitary_pine_3275", "score": 100 }'
        # print( "Fake payload: " + payload )
        scoredata = json.loads( payload )
        
        gameid = scoredata['game']
        score = scoredata['score']
        
        response = table.update_item(
            Key={
                'gameid': gameid,
                'score': score
            },
            UpdateExpression="SET scorecount = if_not_exists(scorecount, :start) + :inc",
            ExpressionAttributeValues={
                ':inc': 1,
                ':start': 0
            },
            ReturnValues="UPDATED_NEW"
        )

        print("UpdateItem succeeded:")

    return 'Successfully processed {} records.'.format(len(event['Records']))
