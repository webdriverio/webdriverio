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

Note that built-in interfaces supported are `bdd`, `tdd` and `qunit` (including top-level `test()` calls without an explicit `suite()`). You can also pass a third-party interface name, a path to a local interface module, or a custom interface function to `mochaOpts.ui`, or register one via `mochaOpts.require`. To ensure WebdriverIO wraps your custom interface's test and hook functions properly, name it ending with `-bdd`, `-tdd` or `-qunit` accordingly (defaults to `bdd`).

## `mochaOpts` Options

Options will be passed to the Mocha instance. See the list of supported Mocha options [here](https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options).

`failHookAffectedTests` defaults to `true`. When a `before` or `beforeEach` hook fails, the tests that hook skipped are reported as failed. Set `failHookAffectedTests: false` to report only the hook.

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

For more information on WebdriverIO see the [homepage](https://webdriver.io).
