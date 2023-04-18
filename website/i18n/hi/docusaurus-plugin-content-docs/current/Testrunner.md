---
id: testrunner
title: टेस्टरनर
---

WebdriverIO आपको जल्द से जल्द परीक्षण शुरू करने में मदद करने के लिए अपने स्वयं के परीक्षण धावक के साथ आता है। ऐसा माना जाता है कि यह आपके लिए सभी काम करता है, तृतीय पक्ष सेवाओं को एकीकृत करने की अनुमति देता है, और आपके परीक्षणों को यथासंभव कुशलतापूर्वक चलाने में आपकी सहायता करता है।

WebdriverIO के टेस्टरनर को NPM पैकेज `@wdio/cli`में अलग से बंडल किया गया है।

इसे ऐसे इंस्टाल करें:

```sh npm2yarn
npm install @wdio/cli
```

कमांड लाइन इंटरफ़ेस सहायता देखने के लिए, अपने टर्मिनल में निम्न आदेश टाइप करें:

```sh
$ npx wdio --help

wdio <command>

Commands:
  wdio config                           Initialize WebdriverIO and setup configuration in
                                        your current project.
  wdio install <type> <name>            Add a `reporter`, `service`, or `framework` to
                                        your WebdriverIO project
  wdio repl <option> [capabilities]     Run WebDriver session in command line
  wdio run <configPath>                 Run your WDIO configuration file to initialize
                                        your tests.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

बहुत अच्छा अब आपको कॉन्फ़िगरेशन फ़ाइल को परिभाषित करने की आवश्यकता है जहां आपके परीक्षणों, क्षमताओं और सेटिंग्स के बारे में सारी जानकारी सेट की गई है। यह देखने के लिए [कॉन्फ़िगरेशन फ़ाइल](ConfigurationFile.md) अनुभाग पर स्विच करें कि वह फ़ाइल कैसी दिखनी चाहिए।

`wdio` कॉन्फ़िगरेशन सहायक के साथ, अपनी कॉन्फ़िग फ़ाइल जनरेट करना बहुत आसान है। रन करे:

```sh
$ npx wdio config
```

...और यह हेल्पर यूटिलिटी लॉन्च करता है।

यह आपसे सवाल पूछेगा और एक मिनट से भी कम समय में आपके लिए एक कॉन्फिग फाइल जेनरेट करेगा।

![WDIO कॉन्फ़िगरेशन उपयोगिता](/img/config-utility.gif)

एक बार जब आप अपनी कॉन्फ़िगरेशन फ़ाइल सेट कर लेते हैं, तो आप चलाकर अपने परीक्षण शुरू कर सकते हैं:

```sh
npx wdio run wdio.conf.js
```

आप `run` कमांड के बिना भी अपना टेस्ट रन इनिशियलाइज़ कर सकते हैं:

```sh
npx wdio wdio.conf.js
```

इतना ही! अब, आप वैश्विक चर `browser`के माध्यम से सेलेनियम उदाहरण तक पहुंच सकते हैं।

## कमांड

### `wdio config`

`config` कमांड WebdriverIO कॉन्फ़िगरेशन हेल्पर चलाता है। यह सहायक आपसे आपके WebdriverIO प्रोजेक्ट के बारे में कुछ प्रश्न पूछेगा और आपके उत्तरों के आधार पर एक `wdio.conf.js` फ़ाइल बनाएगा।

उदाहरण:

```sh
wdio config
```

Options:

```
--help            prints WebdriverIO help menu                                [boolean]
--npm             Wether to install the packages using NPM instead of yarn    [boolean]
```

### `wdio run`

> This is the default command to run your configuration.

The `run` command initializes your WebdriverIO configuration file and runs your tests.

Example:

```sh
wdio run ./wdio.conf.js --watch
```

Options:

```
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
--multi-run           Run one or more specs x amount of times            [number]
--mochaOpts           Mocha options
--jasmineOpts         Jasmine options
--cucumberOpts        Cucumber options
```

> Note: Autocompiling can be easily controlled with the appropriate library's ENV Vars. See also Test Runner's Auto Compilation functionality documented in [TypeScript (ts-node)](TypeScript.md) and [Babel (@babel/register)](Babel.md) pages.

### `wdio install`
The `install` command allows you to add reporters and services to your WebdriverIO projects via the CLI.

Example:

```sh
wdio install service sauce # installs @wdio/sauce-service
wdio install reporter dot # installs @wdio/dot-reporter
wdio install framework mocha # installs @wdio/mocha-framework
```

If you want to install the packages using `yarn` instead, you can pass the `--yarn` flag to the command:

```sh
wdio install service sauce --yarn
```

You could also pass a custom configuration path if your WDIO config file is not in the same folder you're working on:

```sh
wdio install service sauce --config="./path/to/wdio.conf.js"
```

#### List of supported services

```
sauce
testingbot
firefox-profile
selenium-standalone
devtools
browserstack
appium
chromedriver
intercept
zafira-listener
reportportal
docker
wiremock
lambdatest
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
cucumber
```

### `wdio repl`

The repl command allows to start an interactive command line interface to run WebdriverIO commands. It can be used for testing purposes or to just quickly spin up WebdriverIO session.

Run tests in local chrome:

```sh
wdio repl chrome
```

or run tests on Sauce Labs:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

You can apply the same arguments as you can in the [run command](#wdio-run).
