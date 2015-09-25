#!/bin/sh -e

[[ -z "$1" ]] && echo "IAM Role ARN must be provided. Example ./createLambda.sh \"arn:aws:iam::123456789:role/lambda_basic_execution\"" && exit 1;

./build.sh

aws lambda create-function \
    --function-name slapBot \
    --runtime nodejs \
    --role "$1" \
    --handler lambda.handler \
    --description "Slap-Bot notifications" \
    --timeout 12 \
    --memory-size 128 \
    --zip-file fileb://$(pwd)/dist/lambda.zip
