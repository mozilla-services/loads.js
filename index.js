var zmq = require('zmq');
var Base = require('mocha/lib/reporters/base')
  
exports = module.exports = Loads;

function Loads(runner) {
  Base.call(this, runner);

  var disableZmq = process.env.DISABLE_ZMQ || false;

  var address = process.env.LOADS_ZMQ_RECEIVER || 'ipc:///tmp/loads-agent-receiver.ipc';
  var workerid = process.env.LOADS_WORKER_ID || 'ohyeah';
  var loadsStatus = process.env.LOADS_STATUS || '1,1,1,1';
  loadsStatus = loadsStatus.split(',');

  var self = this
    , total = runner.total
    , socket = undefined;

  function send(type, data){
    to_send = {
      data_type: type,
      worker_id: workerid
    };

    if (!(type == 'startTestRun' || type == 'stopTestRun'))
      to_send['loads_status'] = loadsStatus

    if (data != undefined) {
      for (var i in data){
        to_send[i] = data[i];
      }
    }

    console.log(to_send);

    if (!disableZmq){
      socket.send(JSON.stringify(to_send));
    }
  }

  if (!disableZmq){
    var socket = zmq.socket('push')
    socket.setsockopt('hwm', 80960);
    socket.setsockopt('linger', 1);
    socket.connect(address);
  }

  // test suite started
  runner.on('start', function(){
    send('startTestRun');
  });

  // test suite finished
  runner.on('end', function(){
    send('stopTestRun');
    if (!disableZmq)
      socket.close();
  });

  runner.on('test', function(test){
    send('startTest', {test: escape(test.title)});
  });

  runner.on('test end', function(test){
    send('stopTest', {test: escape(test.title)});
  });

  runner.on('pass', function(test){
    send('addSuccess', {test: escape(test.title)});
  });

  runner.on('fail', function(test, err){
    send('addFailure', {test: escape(test.title), error: err});
  });

}

function clean(test) {
  return {
      title: test.title
    , fullTitle: test.fullTitle()
    , duration: test.duration
  }
}
