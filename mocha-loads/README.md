# Mocha loads reporter

This a reporter for mocha, sending data to a [loads](http://loads.rtfd.org)
runner.

## Cool, how can I install it?

To install it, you can use `npm`. Until we release this, you will need to `git
checkout` it and then install it, that's doable with something like:

```
$ npm install path/to/mocha-loads
```

## How do I use it then?

Then you can use the `--reporter mocha-loads-reporter` option to be sure to use
the loads reporter, and you should be all set.

    $ mocha test/integration/hello.js --reporter mocha-loads-reporter

Of course, this is meant to be run by loads itself, which setups some
useful environment variables:

* `LOADS_ZMQ_RECEIVER` (defaults to 'ipc:///tmp/loads-agent-receiver.ipc')
* `LOADS_WORKER_ID` (defaults to 'ohyeah')
* `LOADS_STATUS` (defaults to '1,1,1,1')
