var proxyquire = require('proxyquire');
var Promise = require('bluebird');

Promise.onPossiblyUnhandledRejection(function(reason) {
  console.log("possibly unhandled rejected Promise");
});

describe('SlapBot', function() {

  describe('piplineCheck', function() {

    var slapbot;
    var helperSpy;
    var slackSpy;
    var snapSpy;
    var testConfig;

    beforeEach(function() {
      testConfig = copy(require('../testConfig.js'));
      helperSpy = jasmine.createSpyObj('helpers', ['getPipelineData', 'getMessage', 'hasLastStageBeenTriggeredWithin']);
      slackSpy = jasmine.createSpyObj('slackSpy', ['setWebhook', 'webhook']);;
      snapSpy = jasmine.createSpy('snapSpy');

      slapbot = proxyquire('../../lib/SlapBot.js', {
        './helpers.js': helperSpy,
        'slack-node': function() {
          return slackSpy;
        },
        'node-snap-ci': snapSpy
      });

      helperSpy.getMessage.and.returnValue(Promise.resolve('message'));
    });

    it('should throw when a required parameter is not provided', function() {
      expect(function() {
        slapbot.pipelineCheck({});
      }).toThrow(new Error('An array of 1 or more Github projects required'));

      expect(function() {
        slapbot.pipelineCheck({
          projects: []
        });
      }).toThrow(new Error('An array of 1 or more Github projects required'));

      expect(function() {
        slapbot.pipelineCheck({
          projects: ['woot']
        });
      }).toThrow(new Error('Snap API Key required'));

      expect(function() {
        slapbot.pipelineCheck({
          projects: ['woot'],
          apiKey: 'api-key'
        });
      }).toThrow(new Error('Snap API User required'));

      expect(function() {
        slapbot.pipelineCheck({
          projects: ['woot'],
          apiKey: 'api-key',
          apiUser: 'api-user'
        });
      }).toThrow(new Error('Snap API Owner required'));

      expect(function() {
        slapbot.pipelineCheck({
          projects: ['woot'],
          apiKey: 'api-key',
          apiUser: 'api-user',
          apiOwner: 'api-owner'
        });
      }).toThrow(new Error('Slack webhook URI required'));

      expect(function() {
        slapbot.pipelineCheck({
          projects: ['woot'],
          apiKey: 'api-key',
          apiUser: 'api-user',
          apiOwner: 'api-owner',
          webhookUri: 'http://localhost/webhook/uri'
        });
      }).toThrow(new Error('Slack channel required'));

    });

    it('should initialize snap with the right credentials', function() {
      testConfig.apiKey = 'api-key-123';
      testConfig.apiUser = 'api-user-999';
      testConfig.apiOwner = 'api-owner-888';

      slapbot.pipelineCheck(testConfig);
      
      expect(snapSpy).toHaveBeenCalledWith({
        apiKey: 'api-key-123',
        apiUser: 'api-user-999',
        apiOwner: 'api-owner-888'
      });
    });

    it('should set the slack webook uri', function() {
      testConfig.webhookUri = 'my-webhook-uri';
      slapbot.pipelineCheck(testConfig);
      expect(slackSpy.setWebhook).toHaveBeenCalledWith('my-webhook-uri');
    });

    it('should use the `pipelines since production` in config', function() {
      testConfig.pipelinesSinceProduction = 3;

      slapbot.pipelineCheck(testConfig);

      expect(testConfig.pipelinesSinceProduction).toBe(3);
    });

    it('should use the default `pipelines since production`', function() {
      slapbot.pipelineCheck(testConfig);

      expect(testConfig.pipelinesSinceProduction).toBe(5);
    });

    it('should call slack with the message', function(done) {
      helperSpy.getMessage.and.returnValue(Promise.resolve('message'));
      snapSpy.and.returnValue('a snap instance.');
      slackSpy.webhook.and.callFake(function(slackOpts, callback) {
        callback();
      });

      slapbot.pipelineCheck(testConfig).finally(function() {
        expect(helperSpy.getMessage).toHaveBeenCalledWith('a snap instance.', testConfig.projects, testConfig.pipelinesSinceProduction);
        expect(slackSpy.webhook).toHaveBeenCalled();
        done();
      });
    });

    it('should NOT call slack when the message rejects', function(done) {
      helperSpy.getMessage.and.returnValue(Promise.reject('no message'));
      snapSpy.and.returnValue('a snap instance.');
      slackSpy.webhook.and.callFake(function(slackOpts, callback) {
        callback();
      });

      slapbot.pipelineCheck(testConfig).finally(function() {
        expect(helperSpy.getMessage).toHaveBeenCalledWith('a snap instance.', testConfig.projects, testConfig.pipelinesSinceProduction);
        expect(slackSpy.webhook).not.toHaveBeenCalled();
        done();
      });
    });

  });

});

function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
