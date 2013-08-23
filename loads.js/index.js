'use strict';

var zmq = require('zmq');

exports = module.exports = {
  LoadsSocket: LoadsSocket,
  getOptionsFromEnviron: getOptionsFromEnviron
}


// An object for sending messages back to loads.
//
function LoadsSocket(options) {
    if (!options) { options = {}; }
    this.receiver = options.receiver;
    this.agentId = options.agentId;
    this.runId = options.runId;
    this.loadsStatus = options.loadsStatus.split(',');
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
      loads_status: this.status
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


// Read default configuration for LoadsSocket out of environ vars.
//
function getOptionsFromEnviron(env) {
  if (typeof env === "undefined") env = process.env;
  var options = {
    agentId: "0",
    runId: "0",
    loadsStatus: "1,1,1,1"
  };
  if (env.hasOwnProperty("LOADS_ZMQ_RECEIVER")) {
    options.receiver = env.LOADS_ZMQ_RECEIVER;
  }
  if (env.hasOwnProperty("LOADS_AGENT_ID")) {
    options.agentId = env.LOADS_AGENT_ID;
  }
  if (env.hasOwnProperty("LOADS_RUN_ID")) {
    options.runId = env.LOADS_RUN_ID;
  }
  if (env.hasOwnProperty("LOADS_STATUS")) {
    options.status = env.LOADS_STATUS;
  }
  return options;
}
