WDIO Cucumber Framework Adapter
===============================

> A WebdriverIO plugin. Adapter for Cucumber.js.

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

## Upgrading to Cucumber 13

This adapter depends on `@cucumber/cucumber` 13, which runs on Node.js 22, 24, or 26 and later. `cucumberOpts.tagExpression` has been removed; use [`tags`](#tags). Cucumber no longer exports `Cli`. See [Cucumber's upgrade guide](https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300) for the rest of the 13.0.0 breaks.

## `cucumberOpts` Options

### backtrace

<Option type="Boolean" default="false">

Show full backtrace for errors.

</Option>

### requireModule

<Option type="String[]" default="[]">

Require modules prior to requiring any support files.

</Option>
Example: `['@babel/register']` or `[['@babel/register', { rootMode: 'upward', ignore: ['node_modules'] }]]`

### failFast

<Option type="Boolean" default="false">

Abort the run on first failure.

</Option>

### name

<Option type="REGEXP[]" default="[]">

Only execute the scenarios with name matching the expression (repeatable).

</Option>

### require

<Option type="String[]" default="[]">

Require files containing your step definitions before executing features. You can also specify a glob to your step definitions.

</Option>
Example: `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`

### import

<Option type="String[]" default="[]">

Paths to where your support code is, for ESM.

</Option>
Example: `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`

### strict

<Option type="Boolean" default="false">

Fail if there are any undefined or pending steps

</Option>

### tags

<Option type="String" default="">

Only execute the features or scenarios with tags matching the expression. Note that untagged
features will still spawn a Selenium session (see issue [webdriverio/webdriverio#1247](https://github.com/webdriverio/webdriverio/issues/1247)).
Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
If passing as a command-line argument, compound expressions may need to be enclosed in three sets of double quotes if WebdriverIO is invoked using `npx` on Windows.

E.g.: `npx wdio wdio.config.js --cucumberOpts.tags """@Smoke and not @Pending"""`

</Option>

### timeout

<Option type="Number" default="30000">

Timeout in milliseconds for step definitions.

</Option>

### retry

<Option type="Number" default="0">

Specify the number of times to retry failing test cases.

</Option>

### retryTagFilter

<Option type="RegExp">

Only retries the features or scenarios with tags matching the expression (repeatable). This option requires '--retry' to be specified.

</Option>

### language

<Option type="String" default="en">

Default language for your feature files

</Option>

### order

<Option type="String" default="defined">

Run tests in defined / random order

</Option>

### format

<Option type="string[]">

Name and output file path of formatter to use.
WebdriverIO primarily supports only the [Formatters](https://github.com/cucumber/cucumber-js/blob/main/docs/formatters.md) that writes output to a file.

</Option>

### formatOptions

<Option type="object">

Options to be provided to formatters

</Option>

### tagsInTitle

<Option type="Boolean" default="false">

Add cucumber tags to feature or scenario name

</Option>
***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### ignoreUndefinedDefinitions

<Option type="Boolean" default="false">

Treat undefined definitions as warnings.

</Option>
***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### failAmbiguousDefinitions

<Option type="Boolean" default="false">

Treat ambiguous definitions as errors.

</Option>
***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

### profile

<Option type="string[]" default="[]">

Specify the profile to use.

</Option>
***Kindly take note that only specific values (worldParameters, name, retryTagFilter) are supported within profiles, as `cucumberOpts` takes precedence. Additionally, when using a profile, make sure that the mentioned values are not declared within `cucumberOpts`.***

## Publishing Report

Cucumber provides a feature to publish your test run reports to `https://reports.cucumber.io/`, which can be controlled either by setting the `publish` flag in `cucumberOpts` or by configuring the `CUCUMBER_PUBLISH_TOKEN` environment variable. However, when you use `WebdriverIO` for test execution, there's a limitation with this approach. It updates the reports separately for each feature file, making it difficult to view a consolidated report.

To overcome this limitation, we've introduced a promise-based method called `publishCucumberReport` within `@wdio/cucumber-framework`. This method should be called in the `onComplete` hook, which is the optimal place to invoke it. `publishCucumberReport` requires the input of the report directory where cucumber message reports are stored.

You can generate `cucumber message` reports by configuring the `format` option in your `cucumberOpts`. It's highly recommended to provide a dynamic file name within the `cucumber message` format option to prevent overwriting reports and ensure that each test run is accurately recorded.

Before using this function, make sure to set the following environment variables:
- CUCUMBER_PUBLISH_REPORT_URL: The URL where you want to publish the Cucumber report. If not provided, the default URL 'https://messages.cucumber.io/api/reports' will be used.
- CUCUMBER_PUBLISH_REPORT_TOKEN: The authorization token required to publish the report. If this token is not set, the function will exit without publishing the report.

Here's an example of the necessary configurations and code samples for implementation:

```javascript
import { v4 as uuidv4 } from 'uuid'
import { publishCucumberReport } from '@wdio/cucumber-framework';

export const config = {
    // ... Other Configuration Options
    cucumberOpts: {
        // ... Cucumber Options Configuration
        format: [
            ['message', `./reports/${uuidv4()}.ndjson`],
            ['json', './reports/test-report.json']
        ]
    },
    async onComplete() {
        await publishCucumberReport('./reports');
    }
}
```

Please note that `./reports/` is the directory where `cucumber message` reports will be stored.

----

For more information on WebdriverIO see the [homepage](http://webdriver.io).


