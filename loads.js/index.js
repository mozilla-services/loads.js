'use strict';

var zmq = require('zmq');

exports = module.exports = LoadsSocket;


function LoadsSocket(receiver, agentId, runId, loadsStatus) {
    this.receiver = receiver;
    this.agentId = agentId;
    this.runId = runId;

    loadsStatus = loadsStatus || '1,1,1,1';
    this.loadsStatus = loadsStatus.split(',');

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