#!/bin/sh

# AWS Lambda function
export lambda_function_name=utcTest
export lambda_function_region=us-east-1
#account=YOURACCOUNTID
export lambda_function_arn="arn:aws:lambda:us-west-2:851369023866:function:utcTest"

# Unreliable Town Clock public SNS Topic
sns_topic_arn=arn:aws:sns:us-west-2:522480313337:unreliable-town-clock-topic-N4N94CWNOMTH

# Allow the SNS Topic to invoke the AWS Lambda function
aws lambda add-permission \
  --function-name $lambda_function_name  \
  --action lambda:InvokeFunction \
  --principal sns.amazonaws.com \
  --source-arn $sns_topic_arn \
  --statement-id $(uuidgen)

# Subscribe the AWS Lambda function to the SNS Topic
aws sns subscribe \
  --topic-arn $sns_topic_arn \
  --protocol lambda \
  --notification-endpoint $lambda_function_arn