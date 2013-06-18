var zmq = require('zmq');
var JSON = require('JSON');
var Base = require('./base')
  
exports = module.exports = Loads;

/**
* Initialize a new "loads" test reporter.
*
* @param {Runner} runner
* @api public
*/

function Loads(runner, options) {
  Base.call(this, runner);

  var address = options.zmq_address || 'tcp://127.0.0.1:5558';

  var self = this
    , stats = this.stats
    , total = runner.total
    , socket = zmq.socket('push').bind(address);

  runner.on('start', function(){
    socket.send(JSON.stringify(['startTest', { test: test,
                                               total: total }]));
  });

  runner.on('pass', function(test){
    socket.send(JSON.stringify(['addSuccess', { test: test }]));
  });

  runner.on('fail', function(test, err){
    socket.send(JSON.stringify(['addFailure', { test: test,
                                                error: err }]));
  });

  runner.on('end', function(){
    socket.send(JSON.stringify(['endTest', { test: test }]));
  });
}

/**
* Return a plain-object representation of `test`
* free of cyclic properties etc.
*
* @param {Object} test
* @return {Object}
* @api private
*/

function clean(test) {
  return {
      title: test.title
    , fullTitle: test.fullTitle()
    , duration: test.duration
  }
}
