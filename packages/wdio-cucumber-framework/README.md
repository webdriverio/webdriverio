WDIO Cucumber Framework Adapter
===============================

> A WebdriverIO plugin. Adapter for CucumberJS v5 testing framework.

## Installation

The easiest way is to keep `@wdio/cucumber-framework` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/cucumber-framework": "^6.3.6"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/cucumber-framework --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

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

Type: `Boolean`<br>
Default: `false`

### requireModule
Require modules prior to requiring any support files.

Type: `String[]`<br>
Default: `[]`<br>
Example: `['@babel/register']` or `[['@babel/register', { rootMode: 'upward', ignore: ['node_modules'] }]] or [() => { require('ts-node').register({ files: true }) }]`

### failAmbiguousDefinitions
**Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself**
Treat ambiguous definitions as errors.

Type: `Boolean`<br>
Default: `false`

### failFast
Abort the run on first failure.

Type: `Boolean`<br>
Default: `false`

### ignoreUndefinedDefinitions
**Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself**
Treat undefined definitions as warnings.

Type: `Boolean`<br>
Default: `false`

### name
Only execute the scenarios with name matching the expression (repeatable).

Type: `REGEXP[]`<br>
Default: `[]`

### profile
Specify the profile to use.

Type: `String[]`<br>
Default: `[]`

### require
Require files containing your step definitions before executing features. You can also specify a glob to your step definitions.

Type: `String[]`<br>
Default: `[]`<br>
Example: `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`

### snippetSyntax
Specify a custom snippet syntax.

Type: `String`<br>
Default: `undefined`

### snippets
Hide step definition snippets for pending steps.

Type: `Boolean`<br>
Default: `true`

### source
Hide source uris.

Type: `Boolean`<br>
Default: `true`

### strict
Fail if there are any undefined or pending steps

Type: `Boolean`<br>
Default: `false`

### tagExpression
Only execute the features or scenarios with tags matching the expression. Note that untagged
features will still spawn a Selenium session (see issue [webdriverio/webdriverio#1247](https://github.com/webdriverio/webdriverio/issues/1247)).
Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
If passing as a command-line argument, compound expressions may need to be enclosed in three sets of double quotes if WebdriverIO is invoked using `npx` on Windows.

E.g.: `npx wdio wdio.config.js --cucumberOpts.tagExpression """@Smoke and not @Pending"""`

Type: `String`<br>
Default: ``

### tagsInTitle
Add cucumber tags to feature or scenario name

Type: `Boolean`<br>
Default: `false`

### timeout
Timeout in milliseconds for step definitions.

Type: `Number`<br>
Default: `30000`

### retry
Specify the number of times to retry failing test cases.

Type: `Number`<br>
Default: `0`

### retryTagFilter
Only retries the features or scenarios with tags matching the expression (repeatable). This option requires '--retry' to be specified.

Type: `RegExp`

----

## Troubleshooting

### Reporting format

You may notice while browsing this library and looking at the cucumber and WebdriverIO docs, that the term reporter is used in a few places.

If you require changing the CLI reporting format, you may wish to look at the documentation on the [spec reporter](/docs/spec-reporter.html#installation).

Using the spec reporter can produce output such as the following contrived example:

```
 "spec" Reporter:
------------------------------------------------------------------
[chrome 87.0.4280.66 windows #0-0] Spec: ####################################\e2e\features\login.feature
[chrome 87.0.4280.66 windows #0-0] Running: chrome (v87.0.4280.66) on windows
[chrome 87.0.4280.66 windows #0-0] Session ID: 0fa689bb8b4fb47b83f8e343983d1059
[chrome 87.0.4280.66 windows #0-0]
[chrome 87.0.4280.66 windows #0-0] Login
[chrome 87.0.4280.66 windows #0-0]     As a user, I recieve an error message when using invalid credentials to log into the application
[chrome 87.0.4280.66 windows #0-0]        ✓ Given I am on the login page
[chrome 87.0.4280.66 windows #0-0]        ✓ When I login with ############ and empty_string
[chrome 87.0.4280.66 windows #0-0]        ✓ Then I should see an error message saying The password field is empty.
[chrome 87.0.4280.66 windows #0-0]
[chrome 87.0.4280.66 windows #0-0]     As a user, I recieve an error message when using invalid credentials to log into the application
[chrome 87.0.4280.66 windows #0-0]        ✓ Given I am on the login page
[chrome 87.0.4280.66 windows #0-0]        ✓ When I login with empty_string and ############
[chrome 87.0.4280.66 windows #0-0]        ✓ Then I should see an error message saying The username field is empty.
[chrome 87.0.4280.66 windows #0-0]
[chrome 87.0.4280.66 windows #0-0]     As a user, I can login
[chrome 87.0.4280.66 windows #0-0]        ✓ Given I am on the login page
[chrome 87.0.4280.66 windows #0-0]        ✓ When I login as an admin
[chrome 87.0.4280.66 windows #0-0]        ✓ Then I should be on the admin dashboard page
[chrome 87.0.4280.66 windows #0-0]
[chrome 87.0.4280.66 windows #0-0] 9 passing (9.6s)


Spec Files:      1 passed, 1 total (100% completed) in 00:00:14
```

For more information on WebdriverIO see the [homepage](http://webdriver.io).
