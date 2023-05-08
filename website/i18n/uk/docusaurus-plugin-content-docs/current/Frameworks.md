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

Потім ви можете налаштувати середовище Jasmine, додавши властивість `jasmineOpts` до файлу конфігурації. Список усіх можливих параметрів можна знайти на вебсайті фреймворку [Jasmine](https://jasmine.github.io/api/3.5/Configuration.html).

### Перехоплення перевірок

Фреймворк Jasmine дозволяє перехоплювати кожну перевірку, щоб залогувати стан застосунку або вебсайту, залежно від результату перевірки.

Наприклад, дуже зручно робити скріншот кожного разу, коли перевірка закінчується невдало. В об'єкт `jasmineOpts` ви можете додати властивість під назвою `expectationResultHandler`, яка приймає функцію для виконання. Параметри цієї функції надають інформацію про результати перевірки.

У наступному прикладі показано, як зробити знімок екрана, якщо перевірка завершується невдало:

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

**Примітка:** Ви не можете призупиняти виконання тестів, щоб зробити щось асинхронне. В такому разі, може статися так, що команда займатиме забагато часу, і стан застосунку зміниться. (Хоча зазвичай знімок екрана все одно зробиться трохи пізніше, що все ще таки надасть _хоч якусь_ корисну інформацію про помилку.)

### Параметри Jasmine

Наступні параметри можна застосувати у вашому `wdio.conf.js` для налаштування середовища Jasmine за допомогою властивості `jasmineOpts`. Для отримання додаткової інформації про ці параметри конфігурації перегляньте [документацію Jasmine](https://jasmine.github.io/api/edge/Configuration).

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

#### failAmbiguousDefinitions
Розглядати неоднозначні визначення як помилки. Зверніть увагу, що цей параметр підтримується лише `@wdio/cucumber-framework`, і не розпізнається самим cucumber-js.

Type: `boolean`<br /> Default: `false`

#### failFast
Припинити виконання при першому невдалому тесті.

Type: `boolean`<br /> Default: `false`

#### ignoreUndefinedDefinitions
Розглядати невизначені визначення як попередження. Зверніть увагу, що цей параметр підтримується лише @wdio/cucumber-framework, і не розпізнається самим cucumber-js.

Type: `boolean`<br /> Default: `false`

#### names
Виконувати лише сценарії з іменами, які відповідають виразу (повторюване).

Type: `RegExp[]`<br /> Default: `[]`

#### profile
Профіль для використання.

Type: `string[]`<br /> Default: `[]`

#### require
Файли, що містять визначення ваших кроків, які буде підключено перед виконанням функцій. Ви також можете вказати ґлоб патерн до файлів із визначенням кроків.

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### snippetSyntax
Укажіть користувацький фрагмент синтаксису.

Type: `string`<br /> Default: `null`

#### snippets
Приховувати фрагменти із визначенням кроків для кроків в очікуванні.

Type: `boolean`<br /> Default: `true`

#### source
Чи показувати URI.

Type: `boolean`<br /> Default: `true`

#### strict
Викидати помилка, якщо є невизначені або незавершені кроки.

Type: `boolean`<br /> Default: `false`

#### tagExpression
Виконувати функції або сценарії лише з тегами, що відповідають виразу. Будь ласка, перегляньте документацію [Cucumber](https://docs.cucumber.io/cucumber/api/#tag-expressions) для додаткової інформації.

Type: `string`<br /> Default: `null`

#### tagsInTitle
Додати теги Cucumber до назви функції або сценарію.

Type: `boolean`<br /> Default: `false`

#### timeout
Час очікування в мілісекундах для визначення кроків.

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
