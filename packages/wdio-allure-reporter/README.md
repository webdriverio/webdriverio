WDIO Allure Reporter
====================

> A WebdriverIO reporter plugin to create [Allure Test Reports](https://docs.qameta.io/allure-report/).

![Allure Reporter Example](/img/allure.png)

## Installation

The easiest way is to include `@wdio/allure-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/allure-reporter": "^7.0.0"
  }
}
```

You can simply do it by:

```sh
npm install @wdio/allure-reporter --save-dev
```

## Configuration

Configure the output directory in your wdio.conf.js file:

```js
exports.config = {
    // ...
    reporters: [['allure', {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
    }]],
    // ...
}
```
- `outputDir` defaults to `./allure-results`. After a test run is complete, you will find that this directory has been populated with an `.xml` file for each spec, plus a number of `.txt` and `.png` files and other attachments.
- `disableWebdriverStepsReporting` - optional parameter(`false` by default), in order to log only custom steps to the reporter.
- `issueLinkTemplate` - optional parameter, in order to specify the issue link pattern. Reporter will replace `{}` placeholder with value specified in `addIssue(value)` call parameter. Example `https://example.org/issue/{}`
- `tmsLinkTemplate` - optional parameter, in order to specify the tms link pattern. Reporter will replace `{}` placeholder with value specified in `addTestId(value)` call parameter. Example `https://example.org/tms/{}`
- `disableWebdriverScreenshotsReporting` - optional parameter(`false` by default), in order to not attach screenshots to the reporter.
- `useCucumberStepReporter` - optional parameter (`false` by default), set it to true in order to change the report hierarchy when using cucumber. Try it for yourself and see how it looks.
- `disableMochaHooks` - optional parameter (`false` by default), set it to true in order to not fetch the `before/after` stacktrace/screenshot/result hooks into the Allure Reporter.
- `addConsoleLogs` - optional parameter(`false` by default), set to true in order to attach console logs from step to the reporter.

## Supported Allure API
* `addLabel(name, value)` - assign a custom label to test
* `addFeature(featureName)` – assign feature to test
* `addStory(storyName)` – assign user story to test
* `addSeverity(value)` – assign severity to test, accepts one of these values: blocker, critical, normal, minor, trivial
* `addIssue(value)` – assign issue id to test
* `addTestId(value)` – assign TMS test id to test
* `addEnvironment(name, value)` – save environment value
* `addAttachment(name, content, [type])` – save attachment to test.
    * `name` (*String*) - attachment name.
    * `content` – attachment content.
    * `type` (*String*, optional) – attachment MIME-type, `text/plain` by default
* `addArgument(name, value)` - add additional argument to test
* `addDescription(description, [type])` – add description to test.
    * `description` (*String*) - description of the test.
    * `type` (*String*, optional) – description type, `text` by default. Values ['text', 'html','markdown']
* `addStep(title, [{content, name = 'attachment'}], [status])` - add step to test.
    * `title` (*String*) - name of the step.
    * `content` (*String*, optional) - step attachment
    * `name` (*String*, optional) - step attachment name, `attachment` by default.
    * `status` (*String*, optional) - step status, `passed` by default. Must be "failed", "passed" or "broken"
* `startStep(title)` - start with a step
    * `title` (*String*) - name of the step.
* `endStep(status)` - end with a step
    * `status` (*String*, optional) - step status, `passed` by default. Must be "failed", "passed" or "broken"

### Usage
Allure Api can be accessed using:

ES5

```js
const allureReporter = require('@wdio/allure-reporter').default
```

ES6

```js
import allureReporter from '@wdio/allure-reporter'
```

Mocha example

```js
describe('Suite', () => {
    it('Case', () => {
        allureReporter.addFeature('Feature')
    })
})
```

Cucumber example:

```js
Given('I include feature and story name', () => {
    allureReporter.addFeature('Feature_name');
    allureReporter.addStory('Story_name');
})
```

## Displaying the report

The results can be consumed by any of the [reporting tools](https://docs.qameta.io/allure#_reporting) offered by Allure. For example:

### Command-line

Install the [Allure command-line tool](https://www.npmjs.com/package/allure-commandline), and process the results directory:

```sh
allure generate [allure_output_dir] && allure open
```

This will generate a report (by default in `./allure-report`), and open it in your browser.

### Autogenerate Report

You can also auto generate the report by using the Allure command line tool programmatically. To do so install the package in your project by:

```sh
npm i allure-commandline
```

Then add or extend your `onComplete` hook or create a [custom service](/docs/customservices) for this:

```js
// wdio.conf.js
const allure = require('allure-commandline')

exports.config = {
    // ...
    onComplete: function() {
        const reportError = new Error('Could not generate Allure report')
        const generation = allure(['generate', 'allure-results', '--clean'])
        return new Promise((resolve, reject) => {
            const generationTimeout = setTimeout(
                () => reject(reportError),
                5000)

            generation.on('exit', function(exitCode) {
                clearTimeout(generationTimeout)

                if (exitCode !== 0) {
                    return reject(reportError)
                }

                console.log('Allure report successfully generated')
                resolve()
            })
        })
    }
    // ...
}
```

### Jenkins

Install and configure the [Allure Jenkins plugin](https://docs.qameta.io/allure#_jenkins)

## Add Screenshots

Screenshots can be attached to the report by using the `takeScreenshot` function from WebDriverIO in the `afterStep` hook.
First set `disableWebdriverScreenshotsReporting: false` in reporter options, then add in afterStep hook:

```js title="wdio.conf.js"
afterStep: async function (step, scenario, { error, duration, passed }, context) {
  if (error) {
    await browser.takeScreenshot();
  }
}
```

As shown in the example above, when this function is called, a screenshot image will be attached to the allure report.
