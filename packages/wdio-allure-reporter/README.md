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
export const config = {
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
- `issueLinkTemplate` - optional parameter, in order to specify the issue link pattern. Reporter will replace `{}` placeholder with value specified in `addIssue(value)` call parameter. The same logic is applied if Cucumber is used and tag `issue` is set at any level, it will be converted to the link in the report. The parameter value example:
  ```
  https://example.org/issue/{}
  ```
- `tmsLinkTemplate` - optional parameter, in order to specify TMS (Test Management System) link pattern. Reporter will replace `{}` placeholder with value specified in `addTestId(value)` call parameter. The same logic is applied if Cucumber is used and tag `testId` is set at any level, it will be converted to the link in the report. The parameter value example:
  ```
  https://example.org/tms/{}
  ```
- `disableWebdriverScreenshotsReporting` - optional parameter(`false` by default), in order to not attach screenshots to the reporter.
- `useCucumberStepReporter` - optional parameter (`false` by default), set it to true in order to change the report hierarchy when using cucumber. Try it for yourself and see how it looks.
- `disableMochaHooks` - optional parameter (`false` by default), set it to true in order to not fetch the `before/after` stacktrace/screenshot/result hooks into the Allure Reporter.
- `addConsoleLogs` - optional parameter(`false` by default), set to true in order to attach console logs from step to the reporter.
- `reportedEnvironmentVars` (**type:** `Record<string, string>`) - Set this option to display the environment variables in the report. Note that setting this, does not modify the actual environment variables.

## Supported Allure API
* `addLabel(name, value)` - assign a custom label to test
* `addFeature(featureName)` – assign features to test
* `addStory(storyName)` – assign user story to test
* `addSeverity(value)` – assign severity to test, accepts one of these values: blocker, critical, normal, minor, trivial
* `addTag(value)` – assign a tag label to test
* `addEpic(value)` – assign an epic label to test
* `addOwner(value)` – assign an owner label to test
* `addSuite(value)` – assign a suite label to test
* `addSubSuite(value)` – assign a sub suite label to test
* `addParentSuite(value)` – assign a parent suite label to test
* `addIssue(value)` – assign issue id to test
* `addAllureId(value)` – assign allure test ops id label to test
* `addTestId(value)` – assign TMS test id to test
* ~~`addEnvironment(name, value)` ~~ – a deprecated function that no longer works. Use `reportedEnvironmentVars` instead
* `addAttachment(name, content, [type])` – save attachment to test.
    * `name` (*String*) - attachment name.
    * `content` – attachment content.
    * `type` (*String*, optional) – attachment MIME-type, `text/plain` by default
* `addArgument(name, value)` - add an additional argument to test
* `addDescription(description, [type])` – add description to test.
    * `description` (*String*) - description of the test.
    * `type` (*String*, optional) – description type, `text` by default. Values ['text', 'html','markdown']
* `step(name, body)` - starts step with content function inside. Allows to create steps with infinite hierarchy
    * `body` (*Function*) - the step body async function

### Usage
Allure Api can be accessed using:

CJS

```js
const allureReporter = require('@wdio/allure-reporter').default
```

ESM

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

#### Cucumber

Basic Cucumber example:

```js
Given('I include feature and story name', () => {
    allureReporter.addFeature('Feature_name');
    allureReporter.addStory('Story_name');
})
```

#### Custom steps

`step` method simplifies dealing with steps because each step present as an async function with any content inside.
The first argument of the function is the current step, that has most of the allure API methods (such as `label`, `epic`, `attach` etc):

```js
allureReporter.step('my step name', async (s1) => {
    s1.label('foo', 'bar')
    await s1.step('my child step name', async (s2) => {
        // you can add any combination of steps in the body function
    })
})
```

##### Cucumber Tags

Cucumber tags with special names (`issue` and `testId`) are converted to the links (the corresponding link templates must be configured before):
```gherkin
@issue=BUG-1
@testId=TST-2
Feature: This is a feature with global tags that will be converted to Allure links

  @issue=BUG-3
  @testId=TST-4
  Scenario: This is a scenario with tags that will be converted to Allure links
    Given I do something
```

Cucumber tags with special names (`feature`) are mapped to Allure labels:

```gherkin
Feature: Test user role

  @feature=login
  Scenario: Login
    Given I test login
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

You can also auto-generate the report by using the Allure command line tool programmatically. To do so install the package in your project by:

```sh
npm i allure-commandline
```

Then add or extend your `onComplete` hook or create a [custom service](/docs/customservices) for this:

```js
// wdio.conf.js
const allure = require('allure-commandline')

export const config = {
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

Screenshots can be attached to the report by using the `takeScreenshot` function from WebDriverIO in the `afterTest` hook for Mocha and Jasmine or `afterStep` hook for Cucumber.
First set `disableWebdriverScreenshotsReporting: false` in reporter options, then add in afterStep hook:

### Mocha / Jasmine

```js title="wdio.conf.js"
afterTest: async function(test, context, { error, result, duration, passed, retries }) {
    if (error) {
        await browser.takeScreenshot();
    }
}
```

### Cucumber

```js title="wdio.conf.js"
afterStep: async function (step, scenario, { error, duration, passed }, context) {
  if (error) {
    await browser.takeScreenshot();
  }
}
```

As shown in the example above, when this function is called, a screenshot image will be attached to the allure report.
