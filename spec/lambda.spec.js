
var NO_SLAP = 'No slap performed.';
var SLAP_COMPLETE = 'Slap complete.';
var UTC_ARN = 'arn:aws:sns:us-west-2:522480313337:unreliable-town-clock-topic-N4N94CWNOMTH:3d253d5a-50f2-408c-9206-d7d6aa1696bc';

var proxyquire = require('proxyquire');
var Promise = require('bluebird');

describe('lambda', function() {
  var lambda;
  var slapBot;

  beforeEach(function() {
    slapBot = jasmine.createSpyObj('slapBot', ['pipelineCheck']);
    lambda = proxyquire('../lambda.js', {
      './lib/SlapBot.js': slapBot,
      './config.json': {} //TODO mock config
    });
  });

  it('should exit when there isnt a Record', function(done) {
    var event = {
      Records: []
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit when its not an sns event', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:some:event'
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit when the ARN doesnt match the unreliable town clock ARN', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: 'invalid:arn'
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit when the record doesnt have an Sns property', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: UTC_ARN
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit when there isnt an Sns Message', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: UTC_ARN,
        Sns: {}
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit when the message is not a "chime"', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: UTC_ARN,
        Sns: {
          Message: "{\n  \"type\" : \"NOT_A_CHIME\"}"
        }
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit when the event minute doesnt match the chimeOn.minute', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: UTC_ARN,
        Sns: {
          Message: "{\n  \"type\" : \"chime\", \"hour\": \"777\",  \"minute\": \"888\"}"
        }
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit when the event hour doesnt match the chimeOn.hour', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: UTC_ARN,
        Sns: {
          Message: "{\n  \"type\" : \"chime\", \"hour\": \"777\",  \"minute\": \"45\"}"
        }
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit on Saturdays', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: UTC_ARN,
        Sns: {
          Message: "{\n  \"type\" : \"chime\", \"hour\": \"15\",  \"minute\": \"45\", \"timestamp\": \"2015-09-12 02:15 UTC\"}"
        }
      }]
    };

    testNoSlap(lambda, event, done);
  });

  it('should exit on Sundays', function(done) {
    var event = {
      Records: [{
        EventSource: 'aws:sns',
        EventSubscriptionArn: UTC_ARN,
        Sns: {
          Message: "{\n  \"type\" : \"chime\", \"hour\": \"15\",  \"minute\": \"45\", \"timestamp\": \"2015-09-13 02:15 UTC\"}"
        }
      }]
    };

    testNoSlap(lambda, event, done);
  });  

  it('should call context.done() when pipelineCheck resolves', function(done) {
    var event = validUTCEvent();

    var mockConfig = require('./testConfig.json');
    
    slapBot.pipelineCheck.and.returnValue(Promise.resolve());

    lambda = proxyquire('../lambda.js', {
      './lib/SlapBot.js': slapBot,
      './config.json': mockConfig
    });

    lambda.handler(event, {
      done: function(err, results) {
        expect(slapBot.pipelineCheck).toHaveBeenCalledWith(mockConfig);
        expect(results).toBe(SLAP_COMPLETE);
        expect(err).toBe(null);
        done();
      }
    });

  });

  it('should call context.done() when pipelineCheck rejects', function(done) {
    var event = validUTCEvent();

    var mockConfig = require('./testConfig.json');
    
    slapBot.pipelineCheck.and.returnValue(Promise.reject());

    lambda = proxyquire('../lambda.js', {
      './lib/SlapBot.js': slapBot,
      './config.json': mockConfig
    });

    lambda.handler(event, {
      done: function(err, results) {
        expect(slapBot.pipelineCheck).toHaveBeenCalledWith(mockConfig);
        expect(results).toBe(undefined);
        expect(err).toBe('No slap performed. There was an issue.');
        done();
      }
    });

  });  

});

function testNoSlap(lambda, event, done) {
  lambda.handler(event, {
    done: expectNoSlap.bind(null, done)
  });
}

function expectNoSlap(done, err, results) {
  expect(err).toBe(null);
  expect(results).toBe(NO_SLAP);
  done();    
}

function validUTCEvent() {
  return {
    Records: [{
      EventSource: 'aws:sns',
      EventSubscriptionArn: UTC_ARN,
      Sns: {
        Message: "{\n  \"type\" : \"chime\", \"hour\": \"15\",  \"minute\": \"45\"}"
      }
    }]
  }
}
