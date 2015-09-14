// Incoming WebHooks REQUIRED
var DEFAULT_PIPELINES_SINCE_PRODUCTION = 5;

var Promise = require('bluebird');
var Slack = require('slack-node');
var helpers = require('./helpers.js');

module.exports = {
  pipelineCheck: function(opts) {
    if(!opts.projects || !opts.projects.length) throw new Error('An array of 1 or more Github projects required');
    if(!opts.apiKey) throw new Error('Snap API Key required');
    if(!opts.apiUser) throw new Error('Snap API User required');
    if(!opts.apiOwner) throw new Error('Snap API Owner required');
    if(!opts.webhookUri) throw new Error('Slack webhook URI required');
    if(!opts.channel) throw new Error('Slack channel required');

    var slack = new Slack();
    var snap = require('node-snap-ci')({
      apiKey: opts.apiKey,
      apiUser: opts.apiUser,
      apiOwner: opts.apiOwner
    });

    opts.pipelinesSinceProduction = opts.pipelinesSinceProduction || DEFAULT_PIPELINES_SINCE_PRODUCTION;
    slack.setWebhook(opts.webhookUri);

    return helpers.getMessage(snap, opts.projects, opts.pipelinesSinceProduction)
                  .then(function(message) {
                    return new Promise(function(fullfill, reject) {
                      slack.webhook({
                        channel: opts.channel,
                        username: "slap-bot",
                        icon_emoji: ":rotating_light:",
                        text: message
                      }, function(err, response) {
                        fullfill();
                      });
                    });
                  });
  }
}

