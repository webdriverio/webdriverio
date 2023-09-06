WDIO Cucumber Framework Adapter
===============================

> A WebdriverIO plugin. Adapter for CucumberJS v5 testing framework.

## Installation

The easiest way is to keep `@wdio/cucumber-framework` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/cucumber-framework --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

Following code shows the default wdio test runner configuration...

```js
// wdio.conf.js
module.exports = {
  // ...
  framework: 'cucumber',
  cucumberOpts: {
    timeout: 10000
  }
  // ...
};
```

## `cucumberOpts` Options

### backtrace
Show full backtrace for errors.

Type: `Boolean`<br />
Default: `false`

### requireModule
Require modules prior to requiring any support files.

Type: `String[]`<br />
Default: `[]`<br />
Example: `['@babel/register']` or `[['@babel/register', { rootMode: 'upward', ignore: ['node_modules'] }]]`

### failFast
Abort the run on first failure.

Type: `Boolean`<br />
Default: `false`

### name
Only execute the scenarios with name matching the expression (repeatable).

Type: `REGEXP[]`<br />
Default: `[]`

### require
Require files containing your step definitions before executing features. You can also specify a glob to your step definitions.

Type: `String[]`<br />
Default: `[]`<br />
Example: `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`

### import
Paths to where your support code is, for ESM.

Type: `String[]`<br />
Default: `[]`<br />
Example: `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`

### strict
Fail if there are any undefined or pending steps

Type: `Boolean`<br />
Default: `false`

### tags
Only execute the features or scenarios with tags matching the expression. Note that untagged
features will still spawn a Selenium session (see issue [webdriverio/webdriverio#1247](https://github.com/webdriverio/webdriverio/issues/1247)).
Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
If passing as a command-line argument, compound expressions may need to be enclosed in three sets of double quotes if WebdriverIO is invoked using `npx` on Windows.

E.g.: `npx wdio wdio.config.js --cucumberOpts.tags """@Smoke and not @Pending"""`

Type: `String`<br />
Default: ``

### timeout
Timeout in milliseconds for step definitions.

Type: `Number`<br />
Default: `30000`

### retry
Specify the number of times to retry failing test cases.

Type: `Number`<br />
Default: `0`

### retryTagFilter
Only retries the features or scenarios with tags matching the expression (repeatable). This option requires '--retry' to be specified.

Type: `RegExp`

### tagsInTitle
Add cucumber tags to feature or scenario name

Type: `Boolean`<br />
Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### ignoreUndefinedDefinitions
Treat undefined definitions as warnings.

Type: `Boolean`<br />
Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### failAmbiguousDefinitions
Treat ambiguous definitions as errors.

Type: `Boolean`<br />
Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### tagExpression
Only execute the features or scenarios with tags matching the expression. Note that untagged
features will still spawn a Selenium session (see issue [webdriverio/webdriverio#1247](https://github.com/webdriverio/webdriverio/issues/1247)).
Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
If passing as a command-line argument, compound expressions may need to be enclosed in three sets of double quotes if WebdriverIO is invoked using `npx` on Windows.

E.g.: `npx wdio wdio.config.js --cucumberOpts.tagExpression """@Smoke and not @Pending"""`

Type: `String`<br />
Default: ``

***Please note that this option would be deprecated in future. Use [`tags`](#tags) config property instead***

#### profile
Specify the profile to use.

Type: `string[]`<br />
Default: `[]`

***Kindly take note that only specific values (worldParameters, name, retryTagFilter) are supported within profiles, as `cucumberOpts` takes precedence. Additionally, when using a profile, make sure that the mentioned values are not declared within `cucumberOpts`.***
----

For more information on WebdriverIO see the [homepage](http://webdriver.io).
