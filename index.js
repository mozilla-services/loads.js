var zmq = require('zmq');
var Base = require('mocha/lib/reporters/base');

exports = module.exports = Loads;

function Loads(runner) {
  Base.call(this, runner);

  var disableZmq = process.env.DISABLE_ZMQ || false;

  if (!disableZmq){
    var address = process.env.LOADS_ZMQ_RECEIVER;
    console.log('Sending the events to ' + address)
  }

  var agentId = process.env.LOADS_AGENT_ID || 'ohyeah';
  var loadsStatus = process.env.LOADS_STATUS || '1,1,1,1';
  var runId = process.env.LOADS_RUN_ID;
  loadsStatus = loadsStatus.split(',');

  var self = this
    , total = runner.total
    , socket = undefined;

  function send(type, data){
    to_send = {
      data_type: type,
      agent_id: agentId,
      run_id: runId
    };


    if (!(type == 'startTestRun' || type == 'stopTestRun'))
      to_send['loads_status'] = loadsStatus

    if (data != undefined) {
      for (var i in data){
        to_send[i] = data[i];
      }
    }

    to_send = JSON.stringify(to_send);
    console.log(to_send);

    if (!disableZmq){
      msg = new Buffer(String(to_send), 'utf8')
      socket.send(msg);
    }
  }

  if (!disableZmq){

    // This uses the low-level bindings of the zeromq.node library.
    var context = new zmq.Context();
    var socket = new zmq.Socket(context, zmq.ZMQ_PUSH);
    socket.connect(address);
  }

  // test suite finished
  runner.on('end', function(){
    if (!disableZmq){
      // socket._flush();
      socket.close();
      context.close();
    }
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
