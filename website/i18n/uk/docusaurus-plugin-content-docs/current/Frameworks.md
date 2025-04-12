---
id: frameworks
title: Тестові фреймворки
---

WebdriverIO Runner has built-in support for [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/), and [Cucumber.js](https://cucumber.io/). You can also integrate it with 3rd-party open-source frameworks, such as [Serenity/JS](#using-serenityjs).

:::tip Integrating WebdriverIO with test frameworks
To integrate WebdriverIO with a test framework, you need an adapter package available on NPM. Note that the adapter package must be installed in the same location where WebdriverIO is installed. Отже, якщо ви встановили WebdriverIO глобально, обов’язково встановіть глобально і пакунок-адаптер.
:::

Integrating WebdriverIO with a test framework lets you access the WebDriver instance using the global `browser` variable in your spec files or step definitions. Note that WebdriverIO will also take care of instantiating and ending the Selenium session, so you don't have to do it yourself.

## Використання із Mocha

Спочатку встановіть пакунок-адаптер із NPM:

```bash npm2yarn
npm install @wdio/mocha-framework --save-dev
```

За замовчуванням WebdriverIO постачається із вбудованою [бібліотекою перевірок](assertion), яку ви можете використовувати у ваших тестах:

```js
describe('my awesome website', () => {
    it('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

WebdriverIO підтримує такі [інтерфейси Mocha](https://mochajs.org/#interfaces): `BDD` (за замовчуванням), `TDD` і `QUnit`.

Якщо ви хочете описувати свої тести стилі TDD стилі, встановіть значення `tdd` для властивості `ui`, що в об'єкті `mochaOpts` у вашому файлі конфігурацій. Тепер ваші файли із тестами можуть містити наступне:

```js
suite('my awesome website', () => {
    test('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

Якщо ви хочете визначити й інші налаштування Mocha, ви можете додати їх до об'єкта `mochaOpts` у файлі конфігурації. Список усіх варіантів можна знайти на вебсайті фреймворку [Mocha](https://mochajs.org/api/mocha).

__Примітка:__ WebdriverIO не підтримує застарілий метод зворотного виклику `done` у Mocha:

```js
it('should test something', (done) => {
    done() // throws "done is not a function"
})
```

### Параметри Mocha

Наступні параметри можна застосувати у вашому `wdio.conf.js` для налаштування середовища Mocha. __Примітка:__ не всі параметри підтримуються, наприклад, застосування параметра `parallel` призведе до помилки, оскільки виконувач тестів WDIO має власний механізм паралельного запуску тестів. You can pass these framework options as arguments, e.g.:

```sh
wdio run wdio.conf.ts --mochaOpts.grep "my test" --mochaOpts.bail --no-mochaOpts.checkLeaks
```

This will pass along the following Mocha options:

```ts
{
    grep: ['my-test'],
    bail: true
    checkLeacks: false
}
```

The following Mocha options are supported:

#### require
Параметр `require` корисний, коли ви хочете додати або розширити деякі вбудовані функції (WebdriverIO параметр).

Type: `string|string[]`<br /> Default: `[]`

#### compilers
Використовуйте вказаний(і) модуль(і) для компіляції файлів. Компілятори будуть підключені раніше, ніж `require` (WebdriverIO параметр).

Type: `string[]`<br /> Default: `[]`

#### allowUncaught
Поширювати неперехоплені помилки.

Type: `boolean`<br /> Default: `false`

#### bail
Зупинитися після першого невдалого тесту.

Type: `boolean`<br /> Default: `false`

#### checkLeaks
Перевіряти на наявність витоку глобальних змінних.

Type: `boolean`<br /> Default: `false`

#### delay
Відкласти виконання головного набору.

Type: `boolean`<br /> Default: `false`

#### fgrep
Відфільтрувати тести на відповідність вказаному рядку.

Type: `string`<br /> Default: `null`

#### forbidOnly
Використання `only` у тестових файлах викличе визнання всього набору тестів невдалим.

Type: `boolean`<br /> Default: `false`

#### forbidPending
Використання `skip` у тестових файлах викличе визнання всього набору тестів невдалим.

Type: `boolean`<br /> Default: `false`

#### fullTrace
Показати повний стек викликів у разі помилки.

Type: `boolean`<br /> Default: `false`

#### global
Очікувані глобальні змінні.

Type: `string[]`<br /> Default: `[]`

#### grep
Відфільтрувати тести на відповідність вказаному регулярному виразу.

Type: `RegExp|string`<br /> Default: `null`

#### invert
Інвертувати збіги фільтра тестів.

Type: `boolean`<br /> Default: `false`

#### retries
Кількість повторень для невдалих тестів.

Type: `number`<br /> Default: `0`

#### timeout
Порогове значення тайм-ауту (у мс).

Type: `number`<br /> Default: `30000`

## Використання із Jasmine

Спочатку встановіть пакунок-адаптер із NPM:

```bash npm2yarn
npm install @wdio/jasmine-framework --save-dev
```

Потім ви можете налаштувати середовище Jasmine, додавши властивість `jasmineOpts` до файлу конфігурації. Список усіх можливих параметрів можна знайти на вебсайті фреймворку [Jasmine](https://jasmine.github.io/api/3.5/Configuration.html).

### Параметри Jasmine

Наступні параметри можна застосувати у вашому `wdio.conf.js` для налаштування середовища Jasmine за допомогою властивості `jasmineOpts`. Для отримання додаткової інформації про ці параметри конфігурації перегляньте [документацію Jasmine](https://jasmine.github.io/api/edge/Configuration). You can pass these framework options as arguments, e.g.:

```sh
wdio run wdio.conf.ts --jasmineOpts.grep "my test" --jasmineOpts.failSpecWithNoExpectations --no-jasmineOpts.random
```

This will pass along the following Mocha options:

```ts
{
    grep: ['my-test'],
    bail: true
    checkLeacks: false
}
```

The following Jasmine options are supported:

#### defaultTimeoutInterval
Інтервал очікування за замовчуванням для операцій Jasmine.

Type: `number`<br /> Default: `60000`

#### helpers
Масив зі шляхами (або ґлобами) до файлів відносно spec_dir для підключення перед тестами jasmine.

Type: `string[]`<br /> Default: `[]`

#### requires
Параметр `requires` корисний, коли ви хочете додати або розширити деякі вбудовані функції.

Type: `string[]`<br /> Default: `[]`

#### random
Чи рандомізувати порядок виконання тестів.

Type: `boolean`<br /> Default: `true`

#### seed
Початкове число для використання як основи рандомізації. Null призводить до випадкового визначення початкового числа на початку виконання.

Type: `Function`<br /> Default: `null`

#### failSpecWithNoExpectations
Чи вважати тест невдалим, якщо у ньому не має жодної перевірки. За замовчуванням тест, який не виконує жодної перевірки, буде вважатися успішним. Якщо встановити цей параметр у true, такий тест буде вважатися невдалим.

Type: `boolean`<br /> Default: `false`

#### oneFailurePerSpec
Чи обмежувати тестові файли тільки однією невдалою перевіркою.

Type: `boolean`<br /> Default: `false`

#### specFilter
Функція для фільтрації тестів.

Type: `Function`<br /> Default: `(spec) => true`

#### grep
Виконуйте лише тести, які відповідають цьому рядку або регулярному виразу. (Застосовується, лише якщо не встановлено функцію `specFilter`)

Type: `string|Regexp`<br /> Default: `null`

#### invertGrep
Якщо true, буде виконано лише ті тести, що не збігаються з виразом, використаним у `grep`. (Застосовується, лише якщо не встановлено функцію `specFilter`)

Type: `boolean`<br /> Default: `false`

## Використання із Cucumber

Спочатку встановіть пакунок-адаптер із NPM:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

Якщо ви хочете використовувати Cucumber, установіть для властивості `framework` значення `cucumber`, додавши `framework: 'cucumber'` до [файлу конфігурації](configurationfile).

Параметри для Cucumber можна вказати у файлі конфігурації в об'єкті `cucumberOpts`. Перегляньте повний список параметрів [тут](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options).

Щоб швидко налаштувати роботу із Cucumber, перегляньте наш проєкт [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate), який містить усі необхідні визначення, і ви відразу зможете почати описувати файли функцій.

### Параметри Cucumber

Наступні параметри можна застосувати у вашому `wdio.conf.js` для налаштування середовища Cucumber за допомогою властивості `cucumberOpts`:

:::tip Adjusting options through the command line
The `cucumberOpts`, such as custom `tags` for filtering tests, can be specified through the command line. This is accomplished by using the `cucumberOpts.{optionName}="value"` format.

For example, if you want to run only the tests that are tagged with `@smoke`, you can use the following command:

```sh
# When you only want to run tests that hold the tag "@smoke"
npx wdio run ./wdio.conf.js --cucumberOpts.tags="@smoke"
npx wdio run ./wdio.conf.js --cucumberOpts.name="some scenario name" --cucumberOpts.failFast
```

This command sets the `tags` option in `cucumberOpts` to `@smoke`, ensuring that only tests with this tag are executed.

:::

#### backtrace
Показати повний стек викликів для помилок.

Type: `Boolean`<br /> Default: `true`

#### requireModule
Модулі які буде підключено перед, файлами підтримки.

Type: `string[]`<br /> Default: `[]`<br /> Example:

```js
cucumberOpts: {
    requireModule: ['@babel/register']
    // or
    requireModule: [
        [
            '@babel/register',
            {
                rootMode: 'upward',
                ignore: ['node_modules']
            }
        ]
    ]
 }
 ```

#### failFast
Припинити виконання при першому невдалому тесті.

Type: `boolean`<br /> Default: `false`

#### name
Виконувати лише сценарії з іменами, які відповідають виразу (повторюване).

Type: `RegExp[]`<br /> Default: `[]`

#### require
Файли, що містять визначення ваших кроків, які буде підключено перед виконанням функцій. Ви також можете вказати ґлоб патерн до файлів із визначенням кроків.

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### import
Paths to where your support code is, for ESM.

Type: `String[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    import: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### strict
Викидати помилка, якщо є невизначені або незавершені кроки.

Type: `boolean`<br /> Default: `false`

#### tags
Виконувати функції або сценарії лише з тегами, що відповідають виразу. Будь ласка, перегляньте документацію [Cucumber](https://docs.cucumber.io/cucumber/api/#tag-expressions) для додаткової інформації.

Type: `String`<br /> Default: ``

#### timeout
Час очікування в мілісекундах для визначення кроків.

Type: `Number`<br /> Default: `30000`

#### retry
Specify the number of times to retry failing test cases.

Type: `Number`<br /> Default: `0`

#### retryTagFilter
Only retries the features or scenarios with tags matching the expression (repeatable). This option requires '--retry' to be specified.

Type: `RegExp`

#### language
Default language for your feature files

Type: `String`<br /> Default: `en`

#### order
Run tests in defined / random order

Type: `String`<br /> Default: `defined`

#### format
Name and output file path of formatter to use. WebdriverIO primarily supports only the [Formatters](https://github.com/cucumber/cucumber-js/blob/main/docs/formatters.md) that writes output to a file.

Type: `string[]`<br />

#### formatOptions
Options to be provided to formatters

Type: `object`<br />

#### tagsInTitle
Add cucumber tags to feature or scenario name

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

#### ignoreUndefinedDefinitions
Розглядати невизначені визначення як попередження.

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

#### failAmbiguousDefinitions
Розглядати неоднозначні визначення як помилки.

Type: `Boolean`<br /> Default: `false`

***Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself***<br/>

#### tagExpression
Only execute the features or scenarios with tags matching the expression. Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.

Type: `String`<br /> Default: ``

***Please note that this option would be deprecated in future. Use [`tags`](#tags) config property instead***

#### profile
Профіль для використання.

Type: `string[]`<br /> Default: `[]`

***Kindly take note that only specific values (worldParameters, name, retryTagFilter) are supported within profiles, as `cucumberOpts` takes precedence. Additionally, when using a profile, make sure that the mentioned values are not declared within `cucumberOpts`.***

### Skipping tests in cucumber

Note that if you want to skip a test using regular cucumber test filtering capabilities available in `cucumberOpts`, you will do it for all the browsers and devices configured in the capabilities. In order to be able to skip scenarios only for specific capabilities combinations without having a session started if not necessary, webdriverio provides the following specific tag syntax for cucumber:

`@skip([condition])`

were condition is an optional combination of capabilities properties with their values that when **all** matched with cause the tagged scenario or feature to be skipped. Of course you can add several tags to scenarios and features to skip a tests under several different conditions.

You can also use the '@skip' annotation to skip tests without changing `tagExpression'. In this case the skipped tests will be displayed in the test report.

Here you have some examples of this syntax:
- `@skip` or `@skip()`: will always skip the tagged item
- `@skip(browserName="chrome")`: the test will not be executed against chrome browsers.
- `@skip(browserName="firefox";platformName="linux")`: will skip the test in firefox over linux executions.
- `@skip(browserName=["chrome","firefox"])`: tagged items will be skipped for both chrome and firefox browsers.
- `@skip(browserName=/i.*explorer/)`: capabilities with browsers matching the regexp will be skipped (like `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Import Step Definition Helper

In order to use step definition helper like `Given`, `When` or `Then` or hooks, you are suppose to import then from `@cucumber/cucumber`, e.g. like this:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Now, if you use Cucumber already for other types of tests unrelated to WebdriverIO for which you use a specific version you need to import these helpers in your e2e tests from the WebdriverIO Cucumber package, e.g.:

```js
import { Given, When, Then, world, context } from '@wdio/cucumber-framework'
```

This ensures that you use the right helpers within the WebdriverIO framework and allows you to use an independent Cucumber version for other types of testing.

### Publishing Report

Cucumber provides a feature to publish your test run reports to `https://reports.cucumber.io/`, which can be controlled either by setting the `publish` flag in `cucumberOpts` or by configuring the `CUCUMBER_PUBLISH_TOKEN` environment variable. However, when you use `WebdriverIO` for test execution, there's a limitation with this approach. It updates the reports separately for each feature file, making it difficult to view a consolidated report.

To overcome this limitation, we've introduced a promise-based method called `publishCucumberReport` within `@wdio/cucumber-framework`. This method should be called in the `onComplete` hook, which is the optimal place to invoke it. `publishCucumberReport` requires the input of the report directory where cucumber message reports are stored.

You can generate `cucumber message` reports by configuring the `format` option in your `cucumberOpts`. It's highly recommended to provide a dynamic file name within the `cucumber message` format option to prevent overwriting reports and ensure that each test run is accurately recorded.

Before using this function, make sure to set the following environment variables:
- CUCUMBER_PUBLISH_REPORT_URL: The URL where you want to publish the Cucumber report. If not provided, the default URL 'https://messages.cucumber.io/api/reports' will be used.
- CUCUMBER_PUBLISH_REPORT_TOKEN: The authorization token required to publish the report. If this token is not set, the function will exit without publishing the report.

Here's an example of the necessary configurations and code samples for implementation:

```javascript
import { v4 as uuidv4 } from 'uuid'
import { publishCucumberReport } from '@wdio/cucumber-framework';

export const config = {
    // ... Other Configuration Options
    cucumberOpts: {
        // ... Cucumber Options Configuration
        format: [
            ['message', `./reports/${uuidv4()}.ndjson`],
            ['json', './reports/test-report.json']
        ]
    },
    async onComplete() {
        await publishCucumberReport('./reports');
    }
}
```

Please note that `./reports/` is the directory where `cucumber message` reports will be stored.

## Using Serenity/JS

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) is an open-source framework designed to make acceptance and regression testing of complex software systems faster, more collaborative, and easier to scale.

For WebdriverIO test suites, Serenity/JS offers:
- [Enhanced Reporting](https://serenity-js.org/handbook/reporting/?pk_campaign=wdio8&pk_source=webdriver.io) - You can use Serenity/JS as a drop-in replacement of any built-in WebdriverIO framework to produce in-depth test execution reports and living documentation of your project.
- [Screenplay Pattern APIs](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) - To make your test code portable and reusable across projects and teams, Serenity/JS gives you an optional [abstraction layer](https://serenity-js.org/api/webdriverio?pk_campaign=wdio8&pk_source=webdriver.io) on top of native WebdriverIO APIs.
- [Integration Libraries](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io) - For test suites that follow the Screenplay Pattern, Serenity/JS also provides optional integration libraries to help you write [API tests](https://serenity-js.org/api/rest/?pk_campaign=wdio8&pk_source=webdriver.io), [manage local servers](https://serenity-js.org/api/local-server/?pk_campaign=wdio8&pk_source=webdriver.io), [perform assertions](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io), and more!

![Serenity BDD Report Example](/img/serenity-bdd-reporter.png)

### Installing Serenity/JS

To add Serenity/JS to an [existing WebdriverIO project](https://webdriver.io/docs/gettingstarted), install the following Serenity/JS modules from NPM:

```sh npm2yarn
npm install @serenity-js/{core,web,webdriverio,assertions,console-reporter,serenity-bdd} --save-dev
```

Learn more about Serenity/JS modules:
- [`@serenity-js/core`](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/web`](https://serenity-js.org/api/web/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/webdriverio`](https://serenity-js.org/api/webdriverio/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/assertions`](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/console-reporter`](https://serenity-js.org/api/console-reporter/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io)

### Configuring Serenity/JS

To enable integration with Serenity/JS, configure WebdriverIO as follows:

<Tabs>
<TabItem value="wdio-conf-typescript" label="TypeScript" default>

```typescript title="wdio.conf.ts"
import { WebdriverIOConfig } from '@serenity-js/webdriverio';

export const config: WebdriverIOConfig = {

    // Tell WebdriverIO to use Serenity/JS framework
    framework: '@serenity-js/webdriverio',

    // Serenity/JS configuration
    serenity: {
        // Configure Serenity/JS to use the appropriate adapter for your test runner
        runner: 'cucumber',
        // runner: 'mocha',
        // runner: 'jasmine',

        // Register Serenity/JS reporting services, a.k.a. the "stage crew"
        crew: [
            // Optional, print test execution results to standard output
            '@serenity-js/console-reporter',

            // Optional, produce Serenity BDD reports and living documentation (HTML)
            '@serenity-js/serenity-bdd',
            [ '@serenity-js/core:ArtifactArchiver', { outputDirectory: 'target/site/serenity' } ],

            // Optional, automatically capture screenshots upon interaction failure
            [ '@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' } ],
        ]
    },

    // Configure your Cucumber runner
    cucumberOpts: {
        // see Cucumber configuration options below
    },


    // ... or Jasmine runner
    jasmineOpts: {
        // see Jasmine configuration options below
    },

    // ... or Mocha runner
    mochaOpts: {
        // see Mocha configuration options below
    },

    runner: 'local',

    // Any other WebdriverIO configuration
};
```

</TabItem>
<TabItem value="wdio-conf-javascript" label="JavaScript">

```typescript title="wdio.conf.js"
export const config = {

    // Tell WebdriverIO to use Serenity/JS framework
    framework: '@serenity-js/webdriverio',

    // Serenity/JS configuration
    serenity: {
        // Configure Serenity/JS to use the appropriate adapter for your test runner
        runner: 'cucumber',
        // runner: 'mocha',
        // runner: 'jasmine',

        // Register Serenity/JS reporting services, a.k.a. the "stage crew"
        crew: [
            '@serenity-js/console-reporter',
            '@serenity-js/serenity-bdd',
            [ '@serenity-js/core:ArtifactArchiver', { outputDirectory: 'target/site/serenity' } ],
            [ '@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' } ],
        ]
    },

    // Configure your Cucumber runner
    cucumberOpts: {
        // see Cucumber configuration options below
    },


    // ... or Jasmine runner
    jasmineOpts: {
        // see Jasmine configuration options below
    },

    // ... or Mocha runner
    mochaOpts: {
        // see Mocha configuration options below
    },

    runner: 'local',

    // Any other WebdriverIO configuration
};
```

</TabItem>
</Tabs>

Learn more about:
- [Serenity/JS Cucumber configuration options](https://serenity-js.org/api/cucumber-adapter/interface/CucumberConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Serenity/JS Jasmine configuration options](https://serenity-js.org/api/jasmine-adapter/interface/JasmineConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Serenity/JS Mocha configuration options](https://serenity-js.org/api/mocha-adapter/interface/MochaConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [WebdriverIO configuration file](configurationfile)

### Producing Serenity BDD reports and living documentation

[Serenity BDD reports and living documentation](https://serenity-bdd.github.io/docs/reporting/the_serenity_reports) are generated by [Serenity BDD CLI](https://github.com/serenity-bdd/serenity-core/tree/main/serenity-cli), a Java program downloaded and managed by the [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io) module.

To produce Serenity BDD reports, your test suite must:
- download the Serenity BDD CLI, by calling `serenity-bdd update` which caches the CLI `jar` locally
- produce intermediate Serenity BDD `.json` reports, by registering [`SerenityBDDReporter`](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io) as per the [configuration instructions](#configuring-serenityjs)
- invoke the Serenity BDD CLI when you want to produce the report, by calling `serenity-bdd run`

The pattern used by all the [Serenity/JS Project Templates](https://serenity-js.org/handbook/project-templates/?pk_campaign=wdio8&pk_source=webdriver.io#webdriverio) relies on using:
- a [`postinstall`](https://docs.npmjs.com/cli/v9/using-npm/scripts#life-cycle-operation-order) NPM script to download the Serenity BDD CLI
- [`npm-failsafe`](https://www.npmjs.com/package/npm-failsafe) to run the reporting process even if the test suite itself has failed (which is precisely when you need test reports the most...).
- [`rimraf`](https://www.npmjs.com/package/rimraf) as a convenience method to remove any test reports left over from the previous run

```json title="package.json"
{
  "scripts": {
    "postinstall": "serenity-bdd update",
    "clean": "rimraf target",
    "test": "failsafe clean test:execute test:report",
    "test:execute": "wdio wdio.conf.ts",
    "test:report": "serenity-bdd run"
  }
}
```

To learn more about the `SerenityBDDReporter`, please consult:
- installation instructions in [`@serenity-js/serenity-bdd` documentation](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io),
- configuration examples in [`SerenityBDDReporter` API docs](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io),
- [Serenity/JS examples on GitHub](https://github.com/serenity-js/serenity-js/tree/main/examples).

### Using Serenity/JS Screenplay Pattern APIs

The [Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) is an innovative, user-centred approach to writing high-quality automated acceptance tests. It steers you towards an effective use of layers of abstraction, helps your test scenarios capture the business vernacular of your domain, and encourages good testing and software engineering habits on your team.

By default, when you register `@serenity-js/webdriverio` as your WebdriverIO `framework`, Serenity/JS configures a default [cast](https://serenity-js.org/api/core/class/Cast/?pk_campaign=wdio8&pk_source=webdriver.io) of [actors](https://serenity-js.org/api/core/class/Actor/?pk_campaign=wdio8&pk_source=webdriver.io), where every actor can:
- [`BrowseTheWebWithWebdriverIO`](https://serenity-js.org/api/webdriverio/class/BrowseTheWebWithWebdriverIO/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`TakeNotes.usingAnEmptyNotepad()`](https://serenity-js.org/api/core/class/TakeNotes/?pk_campaign=wdio8&pk_source=webdriver.io)

This should be enough to help you get started with introducing test scenarios that follow the Screenplay Pattern even to an existing test suite, for example:

```typescript title="specs/example.spec.ts"
import { actorCalled } from '@serenity-js/core'
import { Navigate, Page } from '@serenity-js/web'
import { Ensure, equals } from '@serenity-js/assertions'

describe('My awesome website', () => {
    it('can have test scenarios that follow the Screenplay Pattern', async () => {
        await actorCalled('Alice').attemptsTo(
            Navigate.to(`https://webdriver.io`),
            Ensure.that(
                Page.current().title(),
                equals(`WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO`)
            ),
        )
    })

    it('can have non-Screenplay scenarios too', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser)
            .toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

To learn more about the Screenplay Pattern, check out:
- [The Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Web testing with Serenity/JS](https://serenity-js.org/handbook/web-testing/?pk_campaign=wdio8&pk_source=webdriver.io)
- ["BDD in Action, Second Edition"](https://www.manning.com/books/bdd-in-action-second-edition)
