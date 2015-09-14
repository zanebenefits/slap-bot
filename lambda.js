var UTC_ARN = 'arn:aws:sns:us-west-2:522480313337:unreliable-town-clock-topic-N4N94CWNOMTH:3d253d5a-50f2-408c-9206-d7d6aa1696bc';

var slapBot = require('./index.js');

var chimeOn = {
  minute: 45,
  hour: 15 // 9 a.m. mountain
};

// entry point for Lambda
module.exports.handler = function(event, context) {
  console.log('EVENT: ', JSON.stringify(event));

  var options = require('./config.json');

  if(event.Records && event.Records[0] && isItTimeToChime(event.Records[0])) {
    slapBot.pipelineCheck(options).finally(function() {
      context.done(null, 'Slap complete.');
    });
  }
  else {
    context.done('No slap performed.');
  }
};

function isItTimeToChime(record) {
  if(record.EventSource !== 'aws:sns' || record.EventSubscriptionArn !== UTC_ARN || !record.Sns || !record.Sns.Message) {
    console.error('Unauthorized event! Not chiming!');
    return false;
  }

  var message = JSON.parse(record.Sns.Message);

  var day = (new Date(message.timestamp)).getUTCDay();

  if(day === 0 || day === 6) {
    return false; // No weekends!
  }

  if(message.type === 'chime' && parseInt(message.minute) === chimeOn.minute && parseInt(message.hour) === chimeOn.hour) {
    return true;
  }

  console.error('Message type(', message.type, ') not equal to "chime" and wrong minute(', message.minute, ') so no chime for you!');
  return false;
}

// Example chime event
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