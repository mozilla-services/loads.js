# Loads.js

A set of tools to run loads loadtests directly from javascript.

## Installation


If you're using [component](https://github.com/component/component)
add mocha-loads-reporter as a dev dependency:

```
$ component install --dev mozilla-services/loads.js
```

  Then tell mocha to use the reporter:

```js
mocha.setup({ ui: 'bdd', reporter: require('mocha-loads-reporter') })
```

  If you're not using component add the `./build` files to
  your page and tell mocha to use the reporter:

```js
mocha.setup({ ui: 'bdd', reporter: Loads  })
```

## Usage

Currently, it's only possible to run mocha tests, using the "loads" reporter.
You need to use the `--reporter loads` syntax with it, as shown here:

    $ mocha test/integration/hello.js --reporter loads --globals zmq_endpoint=tcp://127.0.0.1:5558


## TODO

- Create a specialised runner which registers the reporter automatically

