#!/bin/sh -e

npm install

rm -rf ./dist

mkdir -p dist

npm test

zip -r -q dist/lambda.zip ./ -x ./*\.sh ./.git/**\* ./dist 
