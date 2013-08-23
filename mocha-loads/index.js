var Base = require('mocha/lib/reporters/base');
var loads = require('loads.js');

exports = module.exports = Loads;

function Loads(runner) {
  Base.call(this, runner);

  var options = loads.getOptionsFromEnviron();
  if (!options.receiver) {
    console.error('You need to set the value of LOADS_ZMQ_RECEIVER in order '
                + 'to use the loads reporter.');
    return;
  }
  var socket = new loads.LoadsSocket(options);

  runner.on('test', function(test){
    socket.send('startTest', {test: escape(test.title)});
  });

  runner.on('test end', function(test){
    socket.send('stopTest', {test: escape(test.title)});
  });

  runner.on('pass', function(test){
    socket.send('addSuccess', {test: escape(test.title)});
  });

  runner.on('fail', function(test, err){
    socket.send('addFailure', {test: escape(test.title), error: err});
  });

  // test suite finished
  runner.on('end', function(){
    socket.close();
  });
};
