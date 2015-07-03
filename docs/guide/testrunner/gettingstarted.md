name: gettingstarted
category: testrunner
tags: guide
index: 0
title: WebdriverIO - Test Runner
---

Getting Started
===============

Since `v3` WebdriverIO comes with its own test runner to help you getting started with integration testing
as quick as possible. All the fiddeling around hooking up WebdriverIO with a test framework belongs to the
past. The WebdriverIO runner does all the work for you and helps you to run your tests as efficient as
possible.

First check out the [Install](/guide/getstarted/install.html) section to make sure you
have the runner properly installed. Type the following command in your terminal to test it:

```txt
$ wdio --help
&nbsp;
WebdriverIO CLI runner
&nbsp;
Usage: wdio [options] [configFile]
config file defaults to wdio.conf.js
The [options] object will override values from the config file.
&nbsp;
Options:
  --help, -h            prints WebdriverIO help menu
  --version, -v         prints WebdriverIO version
  --host                selenium server host address
  --port                selenium server port
  --user, -u            username if using a cloud service as Selenium backend
  --key, -k             corresponding access key to the user
  --updateJob           if true update job properties for Sauce Labs job (default: true)
  --logLevel, -l        Level of test output verbosity
  --coloredLogs, -c     if true enables colors for log output (default: true)
  --screenshotPath, -s  saves a screenshot to a given path if a command failes
  --baseUrl, -b         shorten url command calls by setting a base url
  --waitforTimeout, -w  Default timeout for all wait commands
  --framework, -f       defines the framework (Mocha, Jasmine or Cucumber) to run the specs (default: mocha)
  --reporter, -r        reporter to print out the results on stdout
```

Sweet! Now you need to define a configuration file where all information about your tests, capabilities and
settings are set. Switch over to the [Configuration File](/guide/testrunner/configurationfile.html) section
to find out how that file should look like. With the `wdio` configuration helper it is super easy to
generate your config file. Just run:

```sh
$ wdio config
```

and it launches the helper utility. It will ask you questions depending on the answers you give. This way
you can generate your config file in less than a minute.

<div class="cliwindow" style="width: 92%">
![WDIO configuration utility](/images/config-utility.gif "WDIO configuration utility")
</div>

Once you have your configuration file set up you can start your
integration tests by calling:

```sh
$ wdio wdio.conf.js
```

That's it!