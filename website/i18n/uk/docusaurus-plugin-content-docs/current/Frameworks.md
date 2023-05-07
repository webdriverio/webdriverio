---
id: frameworks
title: Тестові фреймворки
---

Наразі виконувач тестів WDIO підтримує [Mocha](http://mochajs.org/),  [Jasmine](http://jasmine.github.io/)і [Cucumber](https://cucumber.io/).

Щоб інтегрувати будь-який із фреймворків з WebdriverIO, у NPM є пакунки-адаптери, які потрібно заздалегідь встановити. Ці пакунки не мають бути встановлені деінде, натомість їх треба встановити в тому самому місці, де встановлено WebdriverIO. Отже, якщо ви встановили WebdriverIO глобально, обов’язково встановіть глобально і пакунок-адаптер.

У тестових файлах (або файлах із визначенням кроків) ви можете отримати доступ до екземпляра WebDriver за допомогою глобальної змінної `browser`. (Вам не потрібно починати або завершувати Selenium сесію. Про це подбає виконувач тестів `WDIO`)

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

Наступні параметри можна застосувати у вашому `wdio.conf.js` для налаштування середовища Mocha. __Примітка:__ не всі параметри підтримуються, наприклад, застосування параметра `parallel` призведе до помилки, оскільки виконувач тестів WDIO має власний механізм паралельного запуску тестів. Підтримуються такі параметри:

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

You can then configure your Jasmine environment by setting a `jasmineOpts` property in your config. A list of all options can be found on the [Jasmine project website](https://jasmine.github.io/api/3.5/Configuration.html).

### Intercept Assertion

The Jasmine framework allows it to intercept each assertion in order to log the state of the application or website, depending on the result.

For example, it is pretty handy to take a screenshot every time an assertion fails. In your `jasmineOpts` you can add a property called `expectationResultHandler` that takes a function to execute. The function’s parameters provide information about the result of the assertion.

The following example demonstrates how to take a screenshot if an assertion fails:

```js
jasmineOpts: {
    defaultTimeoutInterval: 10000,
    expectationResultHandler: function(passed, assertion) {
        /**
         * only take screenshot if assertion failed
         */
        if(passed) {
            return
        }

        browser.saveScreenshot(`assertionError_${assertion.error.message}.png`)
    }
},
```

**Note:** You cannot stop test execution to do something async. It might happen that the command takes too much time and the website state has changed. (Though usually, after another 2 commands the screenshot is taken anyway, which still gives _some_ valuable information about the error.)

### Jasmine Options

The following options can be applied in your `wdio.conf.js` to configure your Jasmine environment using the `jasmineOpts` property. For more information on these configuration options, check out the [Jasmine docs](https://jasmine.github.io/api/edge/Configuration).

#### defaultTimeoutInterval
Default Timeout Interval for Jasmine operations.

Type: `number`<br /> Default: `60000`

#### helpers
Array of filepaths (and globs) relative to spec_dir to include before jasmine specs.

Type: `string[]`<br /> Default: `[]`

#### requires
The `requires` option is useful when you want to add or extend some basic functionality.

Type: `string[]`<br /> Default: `[]`

#### random
Whether to randomize spec execution order.

Type: `boolean`<br /> Default: `true`

#### seed
Seed to use as the basis of randomization. Null causes the seed to be determined randomly at the start of execution.

Type: `Function`<br /> Default: `null`

#### failSpecWithNoExpectations
Whether to fail the spec if it ran no expectations. By default a spec that ran no expectations is reported as passed. Setting this to true will report such spec as a failure.

Type: `boolean`<br /> Default: `false`

#### oneFailurePerSpec
Whether to cause specs to only have one expectation failure.

Type: `boolean`<br /> Default: `false`

#### specFilter
Function to use to filter specs.

Type: `Function`<br /> Default: `(spec) => true`

#### grep
Only run tests matching this string or regexp. (Only applicable if no custom `specFilter` function is set)

Type: `string|Regexp`<br /> Default: `null`

#### invertGrep
If true it inverts the matching tests and only runs tests that don't match with the expression used in `grep`. (Only applicable if no custom `specFilter` function is set)

Type: `boolean`<br /> Default: `false`

## Using Cucumber

First, install the adapter package from NPM:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

If you want to use Cucumber, set the `framework` property to `cucumber` by adding `framework: 'cucumber'` to the [config file](configurationfile) .

Options for Cucumber can be given in the config file with `cucumberOpts`. Check out the whole list of options [here](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options).

To get up and running quickly with Cucumber, have a look on our [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) project that comes with all the step definitions you need to get stared, and you'll be writing feature files right away.

### Cucumber Options

The following options can be applied in your `wdio.conf.js` to configure your Cucumber environment using the `cucumberOpts` property:

#### backtrace
Show full backtrace for errors.

Type: `Boolean`<br /> Default: `true`

#### requireModule
Require modules prior to requiring any support files.

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

#### failAmbiguousDefinitions
Treat ambiguous definitions as errors. Please note that this is a `@wdio/cucumber-framework` specific option and not recognized by cucumber-js itself.

Type: `boolean`<br /> Default: `false`

#### failFast
Abort the run on first failure.

Type: `boolean`<br /> Default: `false`

#### ignoreUndefinedDefinitions
Treat undefined definitions as warnings. Please note that this is a @wdio/cucumber-framework specific option and not recognized by cucumber-js itself.

Type: `boolean`<br /> Default: `false`

#### names
Only execute the scenarios with name matching the expression (repeatable).

Type: `RegExp[]`<br /> Default: `[]`

#### profile
Specify the profile to use.

Type: `string[]`<br /> Default: `[]`

#### require
Require files containing your step definitions before executing features. You can also specify a glob to your step definitions.

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
Specify a custom snippet syntax.

Type: `string`<br /> Default: `null`

#### snippets
Hide step definition snippets for pending steps.

Type: `boolean`<br /> Default: `true`

#### source
Hide source uris.

Type: `boolean`<br /> Default: `true`

#### strict
Fail if there are any undefined or pending steps.

Type: `boolean`<br /> Default: `false`

#### tagExpression
Only execute the features or scenarios with tags matching the expression. Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.

Type: `string`<br /> Default: `null`

#### tagsInTitle
Add cucumber tags to feature or scenario name.

Type: `boolean`<br /> Default: `false`

#### timeout
Timeout in milliseconds for step definitions.

Type: `number`<br /> Default: `30000`

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
- `@skip(browserName=/i.*explorer/`: capabilities with browsers matching the regexp will be skipped (like `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Import Step Definition Helper

In order to use step definition helper like `Given`, `When` or `Then` or hooks, you are suppose to import then from `@cucumber/cucumber`, e.g. like this:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Now, if you use Cucumber already for other types of tests unrelated to WebdriverIO for which you use a specific version you need to import these helpers in your e2e tests from the WebdriverIO Cucumber package, e.g.:

```js
import { Given, When, Then } from '@wdio/cucumber-framework'
```

This ensures that you use the right helpers within the WebdriverIO framework and allows you to use an independant Cucumber version for other types of testing.
