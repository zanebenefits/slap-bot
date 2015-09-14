var Promise = require('bluebird');

var helpers = {
  getPipelineData: getPipelineData,
  formatMessage: formatMessage,
  getMessage: getMessage
};

module.exports = helpers;

function getMessage(snap, projects, pipelinesSinceProduction) {
  return Promise.props(helpers.getPipelineData(snap, projects, pipelinesSinceProduction)).then(function(results) {
    return helpers.formatMessage(results);
  });
}

function formatMessage(results) {
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

  var warning = '';

  if(notPassed.length) {
    warning += ['*BROKEN BUILD(s)*: ', notPassed.join(', ')].join('') + '\n';
  }

  if(notInProduction.length) {
    warning += ['*WARNING!*', '(' + notInProduction.length + ')','projects have older pipelines waiting to go to production:', notInProduction.join(', ')].join(' '); 
  }

  return notPassed.length || notInProduction.length ? warning : null;
}


function getPipelineData(snap, projects, pipelinesSinceProduction) {
  var pipelines = {};

  projects.forEach(function(projectName) {
      pipelines[projectName] = snap.pipelines.all(projectName).then(function(data) {
      return {
        status: data && data._embedded ? data._embedded.pipelines[0].result : '', // status of the `latest` pipeline
        isInProduction: data && data._embedded 
            ? hasLastStageBeenTriggeredWithin(data._embedded.pipelines, pipelinesSinceProduction) 
            : false
      };
    }).catch(function() {
      console.log('tehre was a problem....', arguments);
    });
  });

  return pipelines;
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
