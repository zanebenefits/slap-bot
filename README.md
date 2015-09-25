[![Build Status](https://snap-ci.com/zanebenefits/slap-bot/branch/master/build_image)](https://snap-ci.com/zanebenefits/slap-bot/branch/master)

# slap-bot
slap-bot combines Slack with Snap-CI. With slap-bot you can notify your team when any of your pipelines get stale. 
In the near future you will be able to trigger stages(e.g. deploy to production) directly from slack.

## Prerequisites
1. Snap-CI Account and api key
1. Snap-CI Project
1. Slack Incoming Webhooks URI
1. [AWS CLI](https://aws.amazon.com/cli/)
1. Lambda Basic Execution Role(created during hello world example or see the [Walkthrough Step 2.2](http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-custom-events-create-test-function.html))


## Setup
1. clone this project `git clone https://github.com/zanebenefits/slap-bot`
1. Create a `config.js` file based on `config.sample.js`.
1. Make sure you can build `./build.sh`
1. Create the slap-bot Lambda with role ARN `./awsCreateLambda.sh "<AMAZON_RESOURCE_NAME_OF_ROLE>"`
Example role ARN: `arn:aws:iam::123456789:role/lambda_basic_execution`
1. Test slap-bot will ignore chimes: `./awsInvoke.sh dontchime.json`
1. Test slap-bot will call snap and send a message: `./awsInvoke.sh chime.json`
1. Get Lambda ARN from AWS Console or `aws lambda list-functions`
1. Now that everything works, subscribe your slap-bot lambda to the Unreliable Town Clock by passing in the Lambda ARN `./scripts/subscribeLambdaSns.sh "arn:aws:lambda:us-west-2:123456789:function:slapBot"`

## Workflow
Now if you want to update your lambda all you need to do is make your changes and run `./awsUpdate.sh`. This will run
npm install, run unit tests, bundle the zip file, and then deploy your code to Lambda. As soon as you get a success message
back you're good to go.

`npm run test:watch` will watch js files for changes and rerun the tests in the ./spec folder.
