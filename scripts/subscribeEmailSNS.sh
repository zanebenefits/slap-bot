#!/bin/sh

# Email address
# You can use this script to subscribe your email address to the Unreliable Town Clock which may help you see how it works.
# After running this script you'll receive an email every 15 minutes with the message json.

# Unreliable Town Clock public SNS Topic
# arn:aws:sns:us-west-2:522480313337:unreliable-town-clock-topic-N4N94CWNOMTH

[[ -z "$1" ]] && echo "Email must be provided. Example ./subscribeEmailSNS.sh \"me@email.com\"" && exit 1;

# Subscribe the email address to the SNS Topic
aws sns subscribe \
  --topic-arn "arn:aws:sns:us-west-2:522480313337:unreliable-town-clock-topic-N4N94CWNOMTH" \
  --protocol email \
  --notification-endpoint "$1"
