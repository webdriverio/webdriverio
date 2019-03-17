---
id: clioptions
title: WDIO CLI Optionen
---
WebdriverIO verfügt über einen eigenen Testrunner, um Ihnen dabei zu helfen, schnellstmöglich mit dem Testen zu beginnen. All die Arbeit, die vorher erforderlich war, um WebdriverIO mit einem Test Framework zu integrieren gehört der Vergangenheit an. Der WebdriverIO Testrunner tut nun all diese Arbeit für Sie und hilft dabei Ihre Tests so effizient wie möglich auszuführen.

Beginnend mit v5 von WebdriverIO wird der Testrunner als seperates NPM-Paket zusammengefasst und ist verfügbar unter dem Namen `@wdio/cli`. Um die Kommandozeilen-Schnittstelle zu sehen, geben Sie einfach den folgenden Befehl in Ihrem Terminal ein:

```sh
$ npm install @wdio/cli
$ ./node_modules/.bin/wdio --help

WebdriverIO CLI runner

Usage: wdio [options] [configFile]
Usage: wdio config
Usage: wdio repl <browserName>

config file defaults to wdio.conf.js
The [options] object will override values from the config file.
An optional list of spec files can be piped to wdio that will override
configured specs

Commands:
  wdio.js repl <browserName>  Run WebDriver session in command line

Options:
  --help                prints WebdriverIO help menu                   [boolean]
  --version             prints WebdriverIO version                     [boolean]
  --host, -h            automation driver host address                  [string]
  --port, -p            automation driver port                          [number]
  --user, -u            username if using a cloud service as automation backend
                                                                        [string]
  --key, -k             corresponding access key to the user            [string]
  --watch               watch specs for changes                        [boolean]
  --logLevel, -l        level of logging verbosity
                            [choices: "trace", "debug", "info", "warn", "error"]
  --bail                stop test runner after specific amount of tests have
```

Sehr gut! Nun müssen Sie eine Konfigurationsdatei erstellen, in der alle Informationen über Ihre Tests, Browser und Einstellungen definiert sind. Switch over to the [Configuration File](ConfigurationFile.md) section to find out how that file should look like. With the `wdio` configuration helper it is super easy to generate your config file. Just run:

```sh
$ ./node_modules/.bin/wdio config
```

and it launches the helper utility. It will ask you questions depending on the answers you give. This way you can generate your config file in less than a minute.

![WDIO configuration utility](/img/config-utility.gif)

Once you have your configuration file set up you can start your integration tests by calling:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

That's it! Now, you can access to the selenium instance via the global variable `browser`.

## Run the test runner programmatically

Instead of calling the wdio command you can also include the test runner as module and run in within any arbitrary environment. For that you need to require the `@wdio/cli` package as module the following way:

```js
import Launcher from '@wdio/cli';
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