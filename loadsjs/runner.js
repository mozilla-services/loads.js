#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * A simple loadtest runner, compatible with the "loads" tool external
 * runner protocol.
 *
 */

'use strict';

var async = require('async');
var loads = require('./index.js');

exports = module.exports = run;


//  Get the current time, in seconds.
//
function currentTime() {
  return +new Date() / 1000;
}


//  Run tests from the given object, passing results to loads over the
//  given socket.
//
function run(tests, socket, cb) {

  // Generate list of tests to be run, in order.
  // If given a string, import it as a module.
  // If given a non-function object, run any test-like methods on it.

  var testNames = [];
  var testsToRun = {};

  if (typeof tests === 'string') {
    tests = require(tests);
  }
  if (typeof tests === 'function') {
    testNames.push(tests.name || "test_default");
    testsToRun[testNames[testNames.length - 1]] = tests;
  } else if (typeof tests === 'object') {
    Object.keys(tests).forEach(function(testname) {
      if (typeof tests[testname] === 'function') {
        // Match array indices, or method names with "test" in them.
        if (typeof testname === 'number' || (/.*test.*/i).exec(testname)) {
          testNames.push(testname);
          testsToRun[testname] = tests[testname].bind(tests);
        }
      }
    });
  }

  // Loop through doing runs of the tests until we've exceeded the
  // specified duration, or the specified number of hits.

  var duration = socket.runStatus.duration || 0;
  var startTime = currentTime();

  async.doWhilst(

    // Loop body - do a single run through the tests.
    function doTestRun(cb) {

      // Iterate over the tests, doing each in turn.
      async.eachSeries(testNames, function(testname, cb) {

        // Each test expects to be called with a single callback argument,
        // which provides the LoadsSocket object as special property "socket'.
        var testcb = function(err) {
          if (err) {
            var exc_info = ["JSError", JSON.stringify(err), ""];
            socket.send('addFailure', {test: testname, exc_info: exc_info});
          } else {
            socket.send('addSuccess', {test: testname});
          }
          socket.send('stopTest', {test: testname});
          process.nextTick(function() {
            return cb(null);
          });
        };
        socket.send('startTest', {test: testname});
        testcb.socket = socket;

        // Do the test, being sure to catch any exceptions so that
        // we can report them properly.
        try {
          testsToRun[testname](testcb);
        } catch (err) {
          testcb(err);
        }
      }, cb);

    },

    // Loop condition - stop once hits and duration have been met.
    function checkForTermination() {
      socket.runStatus.currentHit++;
      if (socket.runStatus.currentHit <= socket.runStatus.totalHits) {
        return true;
      }
      if (duration) {
        if (startTime + duration > currentTime()) {
          return true;
        }
      }
    },

    // Exit handler - just invoke the original callback.
    cb
  );
}


// When executed as a script, run tests on module given in command-line args.
// This makes it possible to run this directly as a loads external runner.
if (require.main === module) {
  process.title = 'loadsjs.runner';
  var options = loads.getOptionsFromEnviron();
  var socket = new loads.LoadsSocket(options);
  run(process.argv[2], socket, function(err) {
    socket.close();
    process.exit(err ? 1 : 0);
  });
}
