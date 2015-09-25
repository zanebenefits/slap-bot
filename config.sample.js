/**
 *
 * Create a new file named config.js based on this file. All fields are required except for `doChime()`. Since
 * you are storing apiKeys in this file we don't recommend committing it to github which is why config.js is
 * ignored in .gitignore by default.
 *
 */

module.exports = {
  "channel": "#test",
  "webhookUri": "https://hooks.slack.com/services/TEST",
  "projects": [
    "snap-project-pipeline"
  ],

  // Remove this function from config.js if you want to use the default Chime - Every weekday @ 9:45 a.m. MST
  "doChime": function(message) {
    // return true when you want to chime. This function will run every 15 minutes and the message will
    // contain date/time info based on UTC

    // Chime every day @ 10:00 MST a.m.
    if(parseInt(message.hour) === 16 && parseInt(message.minute) === 0) {
      return true;
    }

    return false;
  },
  "apiKey": "snap-api-key",
  "apiUser": "snap-user",
  "apiOwner": "snap-owner"
};

// Example message from the Unreliable Town Clock
//{
//   "type" : "chime",
//   "timestamp": "2015-05-26 02:15 UTC",
//   "year": "2015",
//   "month": "05",
//   "day": "26",
//   "hour": "02",
//   "minute": "15",
//   "day_of_week": "Tue",
//   "unique_id": "2d135bf9-31ba-4751-b46d-1db6a822ac88",
//   "region": "us-east-1",
//   "sns_topic_arn": "arn:aws:sns:...",
//   "reference": "...",
//   "support": "...",
//   "disclaimer": "UNRELIABLE SERVICE {ACCURACY,CONSISTENCY,UPTIME,LONGEVITY}"
// }
