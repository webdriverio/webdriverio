WDIO Allure Reporter
====================

> A WebdriverIO reporter plugin to create [Allure Test Reports](https://docs.qameta.io/allure/).

![Allure Reporter Example](/img/allure.png)

## Installation

The easiest way is to keep `@wdio/allure-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/allure-reporter": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
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
- `disableWebdriverScreenshotsReporting` - optional parameter(`false` by default), in order to not attach screenshots to the reporter.

## Supported Allure API
* `feature(featureName)` – assign feature to test
* `story(storyName)` – assign user story to test
* `severity(value)` – assign severity to test
* `issue(value)` – assign issue id to test
* `testId(value)` – assign TMS test id to test
* `addEnvironment(name, value)` – save environment value
* `addAttachment(name, content, [type])` – save attachment to test.
* `addArgument(name, value)` - add additional argument to test
    * `name` (*String*) - attachment name.
    * `content` – attachment content.
    * `type` (*String*, optional) – attachment MIME-type, `text/plain` by default
* `addDescription(description, [type])` – add description to test.
    * `description` (*String*) - description of the test.
    * `type` (*String*, optional) – description type, `text` by default. Values ['text', 'html','markdown']
* `addStep(title, [{content, name = 'attachment'}], [status])` - add step to test.
    * `title` (*String*) - name of the step.
    * `content` (*String*, optional) - step attachment
    * `name` (*String*, optional) - step attachment name, `attachment` by default.
    * `status` (*String*, optional) - step status, `passed` by default. Must be "failed", "passed" or "broken"
### Usage
Allure Api can be accessed using:

ES5

```js
const addFeature = require('@wdio/allure-reporter').addFeature
```

ES6

```js
import {addFeature} from '@wdio/allure-reporter'
```

Mocha example

```js
describe('Suite', () => {
    it('Case', () => {
        addFeature('Feature')
    })
})
```

## Displaying the report

The results can be consumed by any of the [reporting tools](https://docs.qameta.io/allure#_reporting) offered by Allure. For example:

### Command-line

Install the [Allure command-line tool](https://www.npmjs.com/package/allure-commandline), and process the results directory:
```bash
allure generate [allure_output_dir] && allure open
```
This will generate a report (by default in `./allure-report`), and open it in your browser.

### Jenkins

Install and configure the [Allure Jenkins plugin](https://docs.qameta.io/allure#_jenkins)

## Add Screenshots

Screenshots can be attached to the report by using the `takeScreenshot` function from WebDriverIO in afterStep hook.

```js
//...
var name = 'ERROR-chrome-' + Date.now()
browser.takeScreenshot('./errorShots/' + name + '.png')
//...
```

As shown in the example above, when this function is called, a screenshot image will be created and saved in the directory, as well as attached to the allure report.
