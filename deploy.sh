#!/bin/sh -e

./build.sh

aws lambda update-function-code \
  --function-name utcTest \
  --zip-file fileb://$(pwd)/dist/lambda.zip
