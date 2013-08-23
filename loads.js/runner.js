#!/usr/bin/env node
// A simple loadtest runner, compatible with the "loads" tool:
//
//    http://loads.readthedocs.org/
//

const zmq = require('zmq');
const loads = require('./index.js');

exports = module.exports = run;

function run(tests, socket, cb) {
  if (typeof tests === 'string') {
    tests = require(tests);
  }

  // We'll run each callable property of the tests object in turn.
  var testnames = Object.keys(tests);

  // Callback that runs the next pending test.
  function doNextTest(cb) {

    // Find the next property that's actually a function.
    // When we run out of names, shift() will return undefined.
    var testname = testnames.shift();
    while (testname && typeof tests[testname] !== 'function') {
      testname = testnames.shift();
    }
    if (typeof testname === 'undefined') return cb(null);

    // Run the test, passing it a callback that also lets
    // it access the LoadsSocket object.
    socket.send('startTest', {test: testname});
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
    }
    testcb.socket = socket;
    tests[testname](testcb);
  }

  // Loop over all tests, running each in turn.
  function doRemainingTests(err) {
    if (err) return cb(err);
    if (testnames.length == 0) return cb(null);
    doNextTest(doRemainingTests);
  };
  doRemainingTests();
}


// When executed as a script, run tests on module given in command-line args.
// This makes it possible to run this directly as a loads external runner.
if (require.main === module) {
  process.title = 'loads.runner';
  var options = loads.getOptionsFromEnviron();
  var socket = new loads.LoadsSocket(options);
  run(process.argv[2], socket, function(err) {
    socket.close();
    process.exit(err ? 1 : 0);
  });
}
