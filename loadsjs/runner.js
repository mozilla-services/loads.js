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

var zmq = require('zmq');
var loads = require('./index.js');

exports = module.exports = run;


//  Run tests from the given object, passing results to loads over the
//  given socket.
//
function run(tests, socket, cb) {

  // Generate list of tests to be run, in order.
  // If given a string, import it as a module.
  // If given a non-function object, run any test-like methods on it.

  var testsToRun = [];
  var testNames = [];

  if (typeof tests === 'string') {
    tests = require(tests);
  }
  if (typeof tests === 'function') {
    testsToRun.push(tests);
    testNames.push(tests.name || "test_default");
  } else if (typeof tests === 'object') {
    Object.keys(tests).forEach(function(testname) {
      if (typeof tests[testname] === 'function') {
        // Match array indices, or method names with "test" in them.
        if (typeof testname === 'number' || (/.*test.*/i).exec(testname)) {
          testsToRun.push(tests[testname].bind(tests));
          testNames.push(testname);
        }
      }
    });
  }

  // Function to execute a single run through the tests.
  // This will be called repeatedly to satisfy the required hits/duration.

  function doTestRun(cb) {

    var curTest = 0;
 
    function doNextTest(cb) {
      var test = testsToRun[curTest];
      var testname = testNames[curTest];
      // The test will be called with a single callback argument, which
      // provides the LoadsSocket object as special property "socket'.
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
      test(testcb);
    }

    function doRemainingTests(cb) {
      if (curTest >= testsToRun.length) return cb(null);
      doNextTest(function(err) {
        if (err) return cb(err);
        curTest++;
        doRemainingTests(cb);
      });
    }

    doRemainingTests(cb);
  }

  // Loop through doing runs of the tests until we've exceeded the
  // specified duration, or the specified number of hits.

  var duration = socket.runStatus.duration || 0;
  var startTime = +new Date() / 1000;

  function doTestRunsUntilFinished(cb) {
    doTestRun(function(err) {
      if (err) return cb(err);
      var keepGoing = false;
      if (socket.runStatus.currentHit < socket.runStatus.totalHits) {
        keepGoing = true;
      }
      if (duration) {
        if (startTime + duration > (+new Date() / 1000)) {
          keepGoing = true;
        }
      }
      if (keepGoing) {
        socket.runStatus.currentHit++;
        doTestRunsUntilFinished(cb);
      } else {
        return cb(null);
      }
    });
  }

  doTestRunsUntilFinished(cb);
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
