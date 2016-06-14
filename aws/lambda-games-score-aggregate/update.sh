#!/bin/bash

## This updates the lambda function with new code from here. It does not change anything else.
# uses aws cli
# requires permission lambda:UpdateFunctionCode

# change these before using
export LAMBDA_FN_NAME=games-scores-aggregate-dev
export LAMBDA_FILE_NAME=lambda_function.py

# these wont need changing
export TEMP_ZIP_NAME=lambda-zip-$LAMBDA_FN_NAME
export TEMP_ZIP=$TEMP_ZIP_NAME.zip

zip $TEMP_ZIP_NAME $LAMBDA_FILE_NAME && aws lambda update-function-code --function-name $LAMBDA_FN_NAME --publish --zip-file fileb://$TEMP_ZIP
rm $TEMP_ZIP
