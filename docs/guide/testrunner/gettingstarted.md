name: gettingstarted
category: testrunner
tags: guide
index: 0
title: WebdriverIO - Test Runner
---

Getting Started
===============

WebdriverIO comes with its own test runner to help you getting started with integration testing as quickly as possible. All the fiddling around hooking up WebdriverIO with a test framework belongs to the past. The WebdriverIO runner does all the work for you and helps you to run your tests as efficient as possible.

To see the command line interface help just type the following command in your terminal:

```txt
$ ./node_modules/.bin/wdio --help

WebdriverIO CLI runner

Usage: wdio [options] [configFile]
config file defaults to wdio.conf.js
The [options] object will override values from the config file.

Options:
  --help, -h            prints WebdriverIO help menu
  --version, -v         prints WebdriverIO version
  --host                selenium server host address
  --port                selenium server port
  --path                Selenium server path (default: /wd/hub)
  --user, -u            username if using a cloud service as Selenium backend
  --key, -k             corresponding access key to the user
  --logLevel, -l        Level of test output verbosity
  --coloredLogs, -c     if true enables colors for log output (default: true)
  --screenshotPath, -s  saves a screenshot to a given path if a command failes
  --baseUrl, -b         shorten url command calls by setting a base url
  --waitforTimeout, -w  Default timeout for all wait commands
  --framework, -f       defines the framework (Mocha, Jasmine or Cucumber) to run the specs (default: mocha)
  --reporters, -r       reporters to print out the results on stdout
  --suite               overwrites the specs attribute and runs the defined suite
  --cucumberOpts.*      Cucumber options, see the full list options at https://github.com/webdriverio/wdio-cucumber-framework#cucumberopts-options
  --jasmineOpts.*       Jasmine options, see the full list options at https://github.com/webdriverio/wdio-jasmine-framework#jasminenodeopts-options
  --mochaOpts.*         Mocha options, see the full list options at http://mochajs.org
```

Sweet! Now you need to define a configuration file where all information about your tests, capabilities and settings are set. Switch over to the [Configuration File](/guide/testrunner/configurationfile.html) section to find out how that file should look like. With the `wdio` configuration helper it is super easy to generate your config file. Just run:

```sh
$ ./node_modules/.bin/wdio config
```

and it launches the helper utility. It will ask you questions depending on the answers you give. This way
you can generate your config file in less than a minute.

<div class="cliwindow" style="width: 92%">
![WDIO configuration utility](/images/config-utility.gif "WDIO configuration utility")
</div>

Once you have your configuration file set up you can start your
integration tests by calling:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

That's it! Now, you can access to the selenium instance via global variable `browser`.
