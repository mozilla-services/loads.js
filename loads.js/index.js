'use strict';

var zmq = require('zmq');

exports = module.exports = LoadsSocket;

// Default configuration for a LoadsSocket is taken from the environment.
//
var defaults = exports.defaults = {
  ZMQ_RECEIVER: 'ipc:///tmp/loads-agent-receiver.ipc',
  AGENT_ID: '0',
  RUN_ID: '0',
  STATUS: '1,1,1,1'
};
for (var k in defaults) {
  if (defaults.hasOwnProperty(k)) {
    if (process.env.hasOwnProperty("LOADS_" + k)) {
      defaults[k] = process.env["LOADS_" + k];
    }
  }
}


// An object for sending messages back to loads.
//
function LoadsSocket(options) {
    if (!options) { options = {}; }
    this.receiver = options.ZMQ_RECEIVER || defaults.ZMQ_RECEIVER;
    this.agentId = options.AGENT_ID || defaults.AGENT_ID;
    this.runId = options.RUN_ID || defaults.RUN_ID;
    this.loadsStatus = (options.STATUS || defaults.STATUS).split(',');
    this.initializeSocket();
}

LoadsSocket.prototype.initializeSocket = function(){
    this.context = new zmq.Context();
    this.socket = new zmq.Socket(this.context, zmq.ZMQ_PUSH);
    this.socket.connect(this.receiver);
};

LoadsSocket.prototype.send = function(type, data, forceSend){
    forceSend = forceSend || false;
    if (!forceSend && (type == 'startTestRun' || type == 'stopTestRun')) {
        // We don't want to authorize these messages anymore. Stop them
        // unless they're being forced.
        console.warn('The "' + type + '" message type should not be used ' +
                     'from the external runners. Use forceSend=true if you ' +
                     'are sure about what you are doing.');
        return;
    }
    var to_send = {
      data_type: type,
      agent_id: this.agentId,
      run_id: this.runId,
      loads_status: this.loadsStatus
    };

    if (data !== undefined) {
      for (var i in data){
        to_send[i] = data[i];
      }
    }

    to_send = JSON.stringify(to_send);
    var msg = new Buffer(String(to_send), 'utf8');
    this.socket.send(msg);
};

LoadsSocket.prototype.close = function(){
    this.socket.close();
    this.context.close();
};
