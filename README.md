# Loads.js

A set of tools to run loads loadtests directly from javascript.

## Installation

You can install loads.js with npm. Go in your project and run

```
$ npm install ../../services/loads.js
```

## Usage

Then you can use the `--reporter mocha-loads-reporter` option to be sure to use
the loads reporter, and you should be all set.

    $ mocha test/integration/hello.js --reporter mocha-loads-reporter

Of course, this is meant to be run by loads itself, which setups some
useful environment variables:

  LOADS_ZMQ_RECEIVER (defaults to 'ipc:///tmp/loads-agent-receiver.ipc')
  LOADS_WORKER_ID (defaults to 'ohyeah')
  LOADS_STATUS (defaults to '1,1,1,1')
