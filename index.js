// Incoming WebHooks REQUIRED
var DEFAULT_PIPELINES_SINCE_PRODUCTION = 5;

var Promise = require('bluebird');
var Slack = require('slack-node');

module.exports = {
  pipelineCheck: function(opts) {
    if(!opts.projects || !opts.projects.length) throw new Error('An array of 1 or more Github projects required');
    if(!opts.apiKey) throw new Error('Snap API Key required');
    if(!opts.apiUser) throw new Error('Snap API User required');
    if(!opts.apiOwner) throw new Error('Snap API Owner required');
    if(!opts.webhookUri) throw new Error('Slack webhook URI required');
    if(!opts.channel) throw new Error('Slack channel required');

    var slack = new Slack();
    var snap = require('snap-ci-api')({
      apiKey: opts.apiKey,
      apiUser: opts.apiUser,
      apiOwner: opts.apiOwner
    });

    opts.pipelinesSinceProduction = opts.pipelinesSinceProduction || DEFAULT_PIPELINES_SINCE_PRODUCTION;
    slack.setWebhook(opts.webhookUri);

    var pipelines = {};

    opts.projects.forEach(function(projectName) {
      pipelines[projectName] = snap.pipelines.all(projectName).then(function(data) {
        return {
          status: data && data._embedded ? data._embedded.pipelines[0].result : '', // status of the `latest` pipeline
          isInProduction: data && data._embedded 
              ? hasLastStageBeenTriggeredWithin(data._embedded.pipelines, opts.pipelinesSinceProduction) 
              : false
        };
      }).catch(function() {
        console.log('tehre was a problem....', arguments);
      });
    });

    return Promise.props(pipelines).then(function(results) {

      var notInProduction = [];
      var notPassed = []; // passed is the GREEN status in snap

      for(var projectName in results) {
        if(results[projectName].isInProduction === false) {
          notInProduction.push('`' + projectName + '`');
        }
        if(results[projectName].status !== 'passed') {
          notPassed.push('`' + projectName + '`');
        }
      }

      var warning = ['*WARNING!*', '(' + notInProduction.length + ')','projects have older pipelines waiting to go to production: ', notInProduction.join(', ')].join(' '); 

      //TODO correct logic?
      if(notPassed.length) {
        warning = [warning, '\n', '*BROKEN BUILD(s)*: ', notPassed.join(', ')].join('');
      }
      // slack emoji
      if(notInProduction.length || notPassed.length) {
        //FIXME so ugly
        return new Promise(function(fullfill, reject) {
          // slack.webhook({
          //   channel: opts.channel,
          //   username: "slap-bot",
          //   icon_emoji: ":rotating_light:",
          //   text: warning
          // }, function(err, response) {
          //   console.log(response);
          //   fullfill();
          // });
        });
      }

      console.log('RESULTS', results);
    });
  }
}

// TODO account for # of days
// has the stage been triggered within the last 5 pipelines
function hasLastStageBeenTriggeredWithin(pipelines, pipelineCount) {
  if(!pipelines || !pipelineCount) {
    throw new Error('Missing parameter(s)!');
  }

  for(var i=0, l=pipelineCount; i<l; i++) {
    if(hasBeenTriggered(pipelines[i].stages, pipelines[i].stages[pipelines[i].stages.length-1].name)) {
      return true;
    }
  }

  return false;
}

function hasBeenTriggered(stages, targetStage) {
  var stage;
  for(var i=0, l=stages.length; i<l; i++) {
    stage = stages[i];
    if(stage.name.toLowerCase() === targetStage.toLowerCase() && stage.result === 'passed' && stage.started_at !== null) {
      return true;
    }
  }
  return false;
}