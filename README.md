# Loads.js

A set of tools to run loads loadtests directly from javascript.

This is not finished, AT ALL. It will kill kittens and the kids playing when them.
Please don't.

Currently, it's only possible to run mocha tests, using the "loads" reporter.
You need to use the `--reporter loads` syntax with it, as shown here:

    $ mocha test/integration/hello.js --reporter loads --globals zmq_endpoint=tcp://127.0.0.1:5558

## Installation

Currently the installation path is all hacky. You need to copy files directly
into the node_modules directory.


## TODO

- Package things properly
- Create a specialised runner which registers the reporter automatically
- Be able to pass options from the command line (currently that's done via env
  variables

