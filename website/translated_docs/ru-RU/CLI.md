---
id: clioptions
title: WDIO CLI Options
---

WebdriverIO поставляется с собственным тест раннером, чтобы помочь приступить к процессу тестирования как можно быстрее. Все, что связано с подключением и настройкой тестовой среды и фреймворков для работы c WebdriverIO, осталось в прошлом. WebdriverIO раннер делает всю работу за вас и помогает сделать процесс тестирования намного эффективнее.

Начиная с 5 версии WebdriverIO, тест раннер представлен в отдельном NPM-пакете `@wdio/cli`. Для просмотра справки по командной строке используйте данную команду в терминале:

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

and it launches the helper utility. It will ask you questions depending on the answers you give. This way you can generate your config file in less than a minute.

![WDIO configuration utility](/img/config-utility.gif)

Once you have your configuration file set up you can start your integration tests by calling:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

That's it! Now, you can access to the selenium instance via the global variable `browser`.

## Программный запуск тестов

Вместе использования wdio команд вы также можете добавить тест раннер, как отдельный модуль, и запустить тесты в любой тестовой среде. Для этого вам понадобится импортировать `@wdio/cli` пакет как указано далее:

```js
import Launcher from '@wdio/cli';
```

После чего, создайте экземпляр Launcher'a и запустите тест. Класс Launcher принимает url до файла конфигурации и параметры, которые перезаписывают значения в конфигурации.

```js
const wdio = new Launcher('/path/to/my/wdio.conf.js', opts);
wdio.run().then((code) => {
    process.exit(code);
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace);
    process.exit(1);
});
```

Команда run возвращает [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), который будет решен, если тесты успешно запустились, и отклонен, если launcher не смог запустить тесты.