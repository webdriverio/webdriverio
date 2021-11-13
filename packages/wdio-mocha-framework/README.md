WDIO Mocha Framework Adapter
============================

> A WebdriverIO plugin. Adapter for Mocha testing framework.

## Installation

The easiest way is to keep `@wdio/mocha-framework` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/mocha-framework --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

Following code shows the default wdio test runner configuration...

```js
// wdio.conf.js
module.exports = {
  // ...
  framework: 'mocha',

  mochaOpts: {
    ui: 'bdd'
  }
  // ...
};
```

Note that interfaces supported are `bdd`, `tdd` and `qunit`. If you want to provide a custom interface, it should expose methods compatible with them and be named ending with `-bdd`, `-tdd` or `-qunit` accordingly.

## `mochaOpts` Options

Options will be passed to the Mocha instance. See the list of supported Mocha options [here](https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options).

----

## `mochaOpts.require (string|string[])`

The `require` option is useful when you want to add or extend some basic functionality. <br />
For example, let's try to create an anonymous `describe`:

**wdio.conf.js**

```js
{
  suites: {
    login: ['tests/login/*.js']
  },

  mochaOpts: {
    require: './hooks/mocha.js'
  }
}
```

**./hooks/mocha.js**

```js
import path from 'path';

let { context, file, mocha, options } = module.parent.context;
let { describe } = context;

context.describe = function (name, callback) {
	if (callback) {
		return describe(...arguments);
	} else {
		callback = name;
		name = path.basename(file, '.js');

		return describe(name, callback);
	}
}
```

**./tests/TEST-XXX.js**

```js
describe(() => {
	it('Login form', function () => {
		this.skip();
	});
});
```

**Output**

```
TEST-XXX
   ✓ Login form
```

## `mochaOpts.compilers (string[])`

Use the given module(s) to compile files. Compilers will be included before requires.

CoffeeScript and similar transpilers may be used by mapping the file extensions and the module name.

```js
{
  mochaOpts: {
    compilers: ['coffee:foo', './bar.js']
  }
}
```

For more information on WebdriverIO see the [homepage](https://webdriver.io).
