#!/bin/sh -e

./build.sh

aws lambda update-function-code \
  --function-name slapBot \
  --zip-file fileb://$(pwd)/dist/lambda.zip
