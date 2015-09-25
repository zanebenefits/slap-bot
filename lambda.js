var UTC_ARN = 'arn:aws:sns:us-west-2:522480313337:unreliable-town-clock-topic-N4N94CWNOMTH:3d253d5a-50f2-408c-9206-d7d6aa1696bc';

var slapBot = require('./lib/SlapBot.js');

// entry point for Lambda
module.exports.handler = function(event, context) {
  console.log('EVENT: ', JSON.stringify(event));

  var options = require('./config.js');

  if(!options || (options.hasOwnProperty('doChime') && typeof options.doChime !== 'function')) {
    return context.done('No slap performed. doChime must be a function.');
  }


  if(event.Records && event.Records[0] && isItTimeToChime(event.Records[0], options.doChime)) {
    slapBot.pipelineCheck(options).then(function() {
      context.done(null, 'Slap complete.');
    }).catch(function() {
      console.log('[SLAP ERROR]: ', arguments);
      context.done('No slap performed. There was an issue.');
    });
  }
  else {
    context.done(null, 'No slap performed.');
  }
};

function isItTimeToChime(record, doChime) {
  if(record.EventSource !== 'aws:sns' || record.EventSubscriptionArn !== UTC_ARN || !record.Sns || !record.Sns.Message) {
    console.error('Unauthorized event! Not chiming!');
    return false;
  }

  var message = JSON.parse(record.Sns.Message);

  if(doChime) {
    return doChime(message);
  }
  else {
    return defaultDoChime(message);
  }

  console.error('Message type(', message.type, ') not equal to "chime" and wrong minute(', message.minute, ') so no chime for you!');
  return false;
}

/**
 * By Default we only chime on weekdays @ 9:45 a.m. mountain time. You may override this method by providing your own
 * doChime() in config.js.
 *
 * @param message contains date/time properties based on UTC. See config.sample.js for an example
 * @returns {boolean}
 */
function defaultDoChime(message) {
  var day = (new Date(message.timestamp)).getUTCDay();

  if(day === 0 || day === 6) {
    return false; // No weekends!
  }

  if(message.type === 'chime' &&
      parseInt(message.minute) === 45 &&
      parseInt(message.hour) === 15) {
    return true;
  }

  return false;
}
