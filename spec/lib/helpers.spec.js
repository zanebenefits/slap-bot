var Promise = require('bluebird');
var proxyquire = require('proxyquire');

describe('Helpers', function() {
  var helpers;
  var snap;
  var projects;

  beforeEach(function() {
    helpers = proxyquire('../../lib/helpers.js', {});
    projects = ['manhattan', 'runway'];
    snap = {
      pipelines: jasmine.createSpyObj('snapMock', ['all'])
    };
  });

  describe('getMessage', function() {
    it('should resolve with the message', function(done) {
      helpers.getPipelineData = jasmine.createSpy('pipelineData');
      helpers.formatMessage = jasmine.createSpy('formatMessage');

      helpers.getPipelineData.and.returnValue(Promise.resolve('some results'));
      helpers.formatMessage.and.returnValue('the message.');

      helpers.getMessage(snap, projects, 3).then(function(message) {
        expect(message).toBe('the message.');
        expect(helpers.getPipelineData).toHaveBeenCalledWith(snap, projects, 3);
        expect(helpers.formatMessage).toHaveBeenCalledWith('some results');
        done();
      });
    });

    it('should reject when there isnt a message', function() {
      helpers.getPipelineData = jasmine.createSpy('pipelineData');
      helpers.formatMessage = jasmine.createSpy('formatMessage');

      helpers.getPipelineData.and.returnValue(Promise.reject('No Message'));
      helpers.formatMessage.and.returnValue('the message.');

      helpers.getMessage(snap, projects, 4).catch(function(message) {
        expect(message).toBe('No Message');
        expect(helpers.getPipelineData).toHaveBeenCalledWith(snap, projects, 4);
        expect(helpers.formatMessage).toHaveBeenCalledWith('some results');
        done();
      });
    });
  });

  describe('getPipelineData', function() {
    it('should call snap for each project', function() {
      snap.pipelines.all.and.returnValue(Promise.reject('No data'));

      helpers.getPipelineData(snap, projects, 5);

      expect(snap.pipelines.all.calls.count()).toBe(projects.length);
    });

    it('should return a map of project promises', function(done) {
      snap.pipelines.all.and.returnValue(Promise.resolve(inProductionPipelineData()));

      var data = helpers.getPipelineData(snap, projects, 5);

      var expected = {
        manhattan: {
          status: 'passed',
          isInProduction: true
        },
        runway: {
          status: 'passed',
          isInProduction: true
        }
      };

      Promise.props(data).then(function(results) {
        expect(results).toEqual(expected);
        done();
      }).catch(function() {
        done('Unexpected fail');
      });
    });

    it('should not be in production if the last stage hasnt been deployed', function(done) {
      var hasBeenCalled = false;
      snap.pipelines.all.and.callFake(function() {
        if(hasBeenCalled) return Promise.resolve(inProductionPipelineData());
        hasBeenCalled = true;
        return Promise.resolve(notInProductionPipelineData());
      });

      var data = helpers.getPipelineData(snap, projects, 1);

      var expected = {
        manhattan: {
          status: 'passed',
          isInProduction: false
        },
        runway: {
          status: 'passed',
          isInProduction: true
        }
      };

      Promise.props(data).then(function(results) {
        expect(results).toEqual(expected);
        done();
      }).catch(function() {
        done('Unexpected fail');
      });
    });
  });

  describe('formatMessage', function() {
    it('should include WARNING when there is a pipeline not in production' ,function() {
      var data = {
        manhattan: {
          status: 'passed',
          isInProduction: false
        },
        runway: {
          status: 'passed',
          isInProduction: false
        }
      };

      var expected = '*WARNING!* (2) projects have older pipelines waiting to go to production: `manhattan`, `runway`';

      var actual = helpers.formatMessage(data);
      
      expect(actual).toBe(expected); 
    });

    it('should include the broken build message when status is not passed', function() {
      var data = {
        manhattan: {
          status: 'failed',
          isInProduction: true
        },
        runway: {
          status: 'unknown',
          isInProduction: true
        }
      };

      var expected = '*BROKEN BUILD(s)*: `manhattan`, `runway`\n';
                     

      var actual = helpers.formatMessage(data);
      
      expect(actual).toBe(expected);   
    });

    it('should include both messages', function() {
      var data = {
        manhattan: {
          status: 'failed',
          isInProduction: true
        },
        runway: {
          status: 'passed',
          isInProduction: false
        }
      };

      var expected = '*BROKEN BUILD(s)*: `manhattan`\n'
                     + '*WARNING!* (1) projects have older pipelines waiting to go to production: `runway`';

      var actual = helpers.formatMessage(data);
      
      expect(actual).toBe(expected);          
    });

    it('should return null', function() {
      var data = {
        manhattan: {
          status: 'passed',
          isInProduction: true
        },
        runway: {
          status: 'passed',
          isInProduction: true
        }
      };

      var actual = helpers.formatMessage(data);

      expect(actual).toBe(null);
    });

  });

});

function notInProductionPipelineData() {
  return {
    _embedded: {
      pipelines: [
        {
          result: 'passed',
          stages: [
            {name: 'build', result: 'passed'},
            {name: 'production', result: null, started_at: null}
          ]
        }
      ]
    }
  }
}

function inProductionPipelineData() {
  return {
    _embedded: {
      pipelines: [
        {
          result: 'passed',
          stages: [
            {name: 'build', result: 'passed'},
            {name: 'production', result: 'passed'}
          ]
        }
      ]
    }
  }
}

