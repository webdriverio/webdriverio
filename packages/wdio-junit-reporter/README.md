WebdriverIO XML Reporter
========================

> A WebdriverIO reporter that creates [Jenkins](http://jenkins-ci.org/) compatible XML based JUnit reports

## Installation

The easiest way is to keep `@wdio/junit-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/junit-reporter": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/junit-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted.html).

## Configuration

Following code shows the default wdio test runner configuration. Just add `'junit'` as reporter
to the array. To get some output during the test you can run the [WDIO Dot Reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-dot-reporter) and the WDIO JUnit Reporter at the same time:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './',
            outputFileFormat: function(opts) { // optional
                return `results-${opts.cid}.${opts.capabilities}.xml`
            }
        }]
    ],
    // ...
};
```

The following options are supported:

### outputDir
Define a directory where your xml files should get stored.

Type: `String`<br>
Required

### outputFileFormat
Define the xml files created after the test execution.
You can choose to have **one file** (*single*) containing all the test suites, **many files** (*multi*) or **both**. Default is *multi*.
- *multi*: set a function to format of your xml files using an `opts` parameter that contains the runner id as well
as the capabilities of the runner.
- *single*: set a function to format you xml file using a `config` parameter that represents the reporter configuration

Type: `Object`<br>
Default: ``{multi: function(opts){return `WDIO.xunit.${opts.capabilities}.${opts.cid}.xml`}}``

```
outputFileFormat: {
    single: function (config) {
        return 'mycustomfilename.xml';
    },
    multi: function (opts) {
        return `WDIO.xunit.${opts.capabilities}.${opts.cid}.xml`
    }
}
```

### suiteNameFormat

Gives the ability to provide custom regex for formatting test suite name (e.g. in output xml ).

Type: `Regex`,<br>
Default: `/[^a-z0-9]+/`

### packageName

You can break out packages by an additional level by setting `'packageName'`. For example, if you wanted to iterate over a test suite with different environment variable set:

Type: `String`<br>
Example:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './',
            packageName: process.env.USER_ROLE // chrome.41 - administrator
        }]
    ]
    // ...
};
```

### errorOptions

Allows to set various combinations of error notifications inside xml.<br>
Given a Jasmine test like `expect(true).toBe(false, 'my custom message')` you will get this test error:

```
{
    matcherName: 'toBe',
    message: 'Expected true to be false, \'my custom message\'.',
    stack: 'Error: Expected true to be false, \'my custom message\'.\n    at UserContext.it (/home/mcelotti/Workspace/WebstormProjects/forcebeatwio/test/marco/prova1.spec.js:3:22)',
    passed: false,
    expected: [ false, 'my custom message' ],
    actual: true
}
```

Therefore you can choose *which* key will be used *where*, see the example below.

Type: `Object`,<br>
Default: `errorOptions: { error: "message" }`<br>
Example:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './',
            errorOptions: {
                error: 'message',
                failure: 'message',
                stacktrace: 'stack'
            }
        }]
    ],
    // ...
};
```

## Jenkins Setup

Last but not least you need to tell your CI job (e.g. Jenkins) where it can find the xml file. To do that, add a post-build action to your job that gets executed after the test has run and point Jenkins (or your desired CI system) to your XML test results:

![Point Jenkins to XML files](https://webdriver.io/img/jenkins-postjob.png "Point Jenkins to XML files")

If there is no such post-build step in your CI system there is probably a plugin for that somewhere on the internet.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
