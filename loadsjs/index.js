/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *
 *  Utilities for interacting with the loads broker.
 *
 *  This package exposes a "LoadSocket" object which encapsulates the state
 *  necessary to send loadtest results through to a loads broker.
 *
 */

'use strict';

var zmq = require('zmq');

exports = module.exports = {
  LoadsSocket: LoadsSocket,
  getOptionsFromEnviron: getOptionsFromEnviron
};


// An object for sending messages back to loads.
//
function LoadsSocket(options) {
    if (!options) { options = {}; }
    this.receiver = options.receiver;
    this.agentId = options.agentId;
    this.runId = options.runId;
    this.runStatus = {
      totalUsers: options.totalUsers || 1,
      totalHits: options.totalHits || 1,
      currentUser: options.currentUser || 1,
      currentHit: options.currentHit || 1,
      duration: options.duration || 0
    };
    this.initializeSocket();
}

LoadsSocket.prototype.initializeSocket = function(){
    this.context = new zmq.Context();
    this.socket = new zmq.Socket(this.context, zmq.ZMQ_PUSH);
    this.socket.connect(this.receiver);
};


// Send a message to the loads broker.
//
LoadsSocket.prototype.send = function(type, data){
    var loadsStatus = [this.runStatus.totalHits, this.runStatus.currentHit,
                       this.runStatus.totalUsers, this.runStatus.currentUser];
    var to_send = {
      data_type: type,
      agent_id: this.agentId,
      run_id: this.runId,
      loads_status: loadsStatus.join(",")
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


// Shutdown the socket; no more data can be sent to the broker.
//
LoadsSocket.prototype.close = function(){
    this.socket.close();
    this.context.close();
};


// Read default configuration for LoadsSocket out of environ vars.
//
function getOptionsFromEnviron(env) {
  if (typeof env === "undefined") env = process.env;
  var options = {
    receiver: "",
    agentId: "",
    runId: "",
    totalUsers: 0,
    totalHits: 0,
    currentUser: 0,
    currentHit: 0,
    duration: 0,
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
  if (env.hasOwnProperty("LOADS_TOTAL_USERS")) {
    options.totalUsers = parseInt(env.LOADS_TOTAL_USERS, 10);
  }
  if (env.hasOwnProperty("LOADS_TOTAL_HITS")) {
    options.totalHits = parseInt(env.LOADS_TOTAL_HITS, 10);
  }
  if (env.hasOwnProperty("LOADS_CURRENT_USER")) {
    options.currentUser = parseInt(env.LOADS_CURRENT_USER, 10);
  }
  if (env.hasOwnProperty("LOADS_CURRENT_HIT")) {
    options.currentHit = parseInt(env.LOADS_CURRENT_HIT, 10);
  }
  if (env.hasOwnProperty("LOADS_DURATION")) {
    options.duration = parseInt(env.LOADS_DURATION, 10);
  }
  return options;
}
