---
id: clioptions
title: WDIO CLI Options
---

WebdriverIO comes with its own test runner to help you get started with integration testing as quickly as possible. All the fiddling around hooking up WebdriverIO with a test framework belongs to the past. The WebdriverIO runner does all the work for you and helps you to run your tests as efficiently as possible.

Starting with v5 of WebdriverIO the testrunner will be bundled as a separate NPM package `@wdio/cli`. To see the command line interface help just type the following command in your terminal:

```sh
$ npm install @wdio/cli
$ ./node_modules/.bin/wdio --help

WebdriverIO CLI runner

Usage: wdio [options] [configFile]
Usage: wdio config
Usage: wdio repl <browserName>
Usage: wdio install <type> <name>

config file defaults to wdio.conf.js
The [options] object will override values from the config file.
An optional list of spec files can be piped to wdio that will override configured specs.
Same applies to the exclude option. It can take a list of specs to exclude for a given run
and it also overrides the exclude key from the config file.

Commands:
  wdio.js repl <browserName>  Run WebDriver session in command line
  wdio.js install <type> <name> Add a `reporter`, `service`, or `framework` to your WebdriverIO project

Options:
  --help                prints WebdriverIO help menu                   [boolean]
  --version             prints WebdriverIO version                     [boolean]
  --hostname, -h        automation driver host address                  [string]
  --port, -p            automation driver port                          [number]
  --user, -u            username if using a cloud service as automation backend
                                                                        [string]
  --key, -k             corresponding access key to the user            [string]
  --watch               watch specs for changes                        [boolean]
  --logLevel, -l        level of logging verbosity
                            [choices: "trace", "debug", "info", "warn", "error", "silent"]
  --bail                stop test runner after specific amount of tests have
                        failed                                          [number]
  --baseUrl             shorten url command calls by setting a base url [string]
  --waitforTimeout, -w  timeout for all waitForXXX commands             [number]
  --framework, -f       defines the framework (Mocha, Jasmine or Cucumber) to
                        run the specs                                   [string]
  --reporters, -r       reporters to print out the results on stdout     [array]
  --suite               overwrites the specs attribute and runs the defined
                        suite                                            [array]
  --spec                run only a certain spec file - overrides specs piped
                        from stdin                                       [array]
  --exclude             exclude spec file(s) from a run - overrides specs piped
                        from stdin                                       [array]
  --mochaOpts           Mocha options
  --jasmineOpts         Jasmine options
  --cucumberOpts        Cucumber options
```

Sweet! Now you need to define a configuration file where all information about your tests, capabilities and settings are set. Switch over to the [Configuration File](ConfigurationFile.md) section to find out how that file should look like. With the `wdio` configuration helper it is super easy to generate your config file. Just run:

```sh
$ ./node_modules/.bin/wdio config
```

and it launches the helper utility. It will ask you questions depending on the answers you give. This way
you can generate your config file in less than a minute.

![WDIO configuration utility](/img/config-utility.gif)

Once you have your configuration file set up you can start your
integration tests by calling:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

That's it! Now, you can access to the selenium instance via the global variable `browser`.

## Commands

### $ wdio install
The `install` command allows you to add reporters and services to your WebdriverIO projects via the CLI.

Example:

```bash
$ wdio install service sauce # installs @wdio/sauce-service
$ wdio install reporter dot # installs @wdio/dot-reporter
$ wdio install framework mocha # installs @wdio/mocha-framework
```

If your project is using `package-lock.json` instead of `yarn.lock`, you can pass a `--npm` flag to make sure the packages are installed via NPM.

```bash
$ wdio install service sauce --npm
```

#### List of supported services
```
sauce
testingbot
firefox-profile
selenium-standalone
devtools
applitools
browserstack
appium
chromedriver
intercept
zafira-listener
reportportal
docker
```

#### List of supported reporters
```
dot
spec
junit
allure
sumologic
concise
reportportal
video
html
json
mochawesome
timeline
```

#### List of supported frameworks
```
mocha
jasmine
```

## Run the test runner programmatically

Instead of calling the wdio command you can also include the test runner as module and run in within any arbitrary environment. For that you need to require the `@wdio/cli` package as module the following way:

```js
import Launcher from '@wdio/cli';
```

ES5
```js
const Launcher = require('@wdio/cli').default;

```
After that you create an instance of the launcher and run the test. The Launcher class expects as parameter the url to the config file and parameters that will overwrite the value in the config.

```js
const wdio = new Launcher('/path/to/my/wdio.conf.js', opts);
wdio.run().then((code) => {
    process.exit(code);
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace);
    process.exit(1);
});
```

The run command returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that gets resolved if the test ran successful or failed or gets rejected if the launcher was not able to start run the tests.
