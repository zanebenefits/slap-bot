#!/bin/sh -e

# install dependencies, run unit tests, and bundle all the files into a deployable zip file.

if [ ! -f ./config.js ]; then
    echo "Unable to build Lambda.zip! \"config.js\" is required!"
    exit 1
fi

npm install


rm -rf ./dist

mkdir -p dist

npm test

zip -r -q dist/lambda.zip ./ -x ./*\.sh ./.git/**\* ./dist ./spec ./scripts ./.idea
