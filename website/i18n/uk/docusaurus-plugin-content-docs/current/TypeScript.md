---
id: typescript
title: Налаштування TypeScript
---

Ви можете писати тести, використовуючи [TypeScript](http://www.typescriptlang.org) для автодоповнення та типізації.

Вам знадобиться встановити [`typescript`](https://github.com/microsoft/TypeScript) і [`ts-node`](https://github.com/TypeStrong/ts-node) як `devDependencies` командою:

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

WebdriverIO автоматично визначить, чи встановлено ці залежності, і скомпілює вашу конфігурацію та тести для вас. Переконайтеся, що `tsconfig.json` знаходиться в тому самому каталозі, що й конфігурація WDIO. Якщо вам потрібно налаштувати роботу ts-node, скористайтеся змінними середовища для [ts-node](https://www.npmjs.com/package/ts-node#options) або скористайтеся [розділом autoCompileOpts](configurationfile) конфігурації wdio.

## Конфігурація

You can provide custom `ts-node` options through the environment (by default it uses the tsconfig.json in the root relative to your wdio config if the file exists):

```sh
# run wdio testrunner with custom options
TS_NODE_PROJECT=./config/tsconfig.e2e.json TS_NODE_TYPE_CHECK=true wdio run wdio.conf.ts
```

Мінімальна версія TypeScript — `v4.0.5`.

## Налаштування фреймворку

Ваш `tsconfig.json` файл потребує додавання наступного:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types"]
    }
}
```

Уникайте явного імпорту `webdriverio` або `@wdio/sync`. `Типи WebdriverIO` і `WebDriver` доступні з будь-якого місця після визначення у `types`, що знаходиться в `tsconfig.json` файлі. Якщо ви використовуєте додаткові служби WebdriverIO, плагіни або пакунок автоматизації `devtools`, будь ласка, також додайте їх до масиву `types`, оскільки багато з них визначають додаткові глобальні типи.

## Типи тестового фреймворка

Залежно від тестового фреймворку, який ви використовуєте, вам потрібно буде додати його типи до `tsconfig.json` файлу, а також, можливо, встановити окремий пакунок із визначенням його типів. Це особливо важливо, якщо ви хочете мати підтримку типів для вбудованої бібліотеки перевірок [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio).

Наприклад, якщо ви вирішите використовувати тестовий фреймворк Mocha, вам потрібно встановити `@types/mocha` й додати його таким чином, щоб усі типи були доступні глобально:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'},
 ]
}>
<TabItem value="mocha">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

</TabItem>
<TabItem value="jasmine">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/jasmine-framework"]
    }
}
```

</TabItem>
<TabItem value="cucumber">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/cucumber-framework"]
    }
}
```

</TabItem>
</Tabs>

## Сервіси

Якщо ви використовуєте сервіси, які додають команди до об'єкта браузера, вам також потрібно додати їх у свій `tsconfig.json`. Наприклад, якщо ви використовуєте `@wdio/lighthouse-service` переконайтеся, що ви додали його до `types`, як показано тут:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "@wdio/lighthouse-service"
        ]
    }
}
```

Додавання сервісів та генераторів звітів до вашої конфігурації TypeScript також типізацію вашого файлу конфігурації WebdriverIO.

## Визначення типів

Під час використання команд WebdriverIO всі властивості зазвичай типізовані, тому вам не потрібно мати справу з імпортом додаткових типів. Однак є випадки, коли потрібно визначити типи змінних заздалегідь. Щоб переконатися, що вони не будуть використані з іншими типами, ви можете використовувати всі типи, визначені в пакунку [`@wdio/types`](https://www.npmjs.com/package/@wdio/types). Наприклад, якщо ви хочете визначити параметри для `webdriverio`, ви можете зробити:

```ts
import type { Options } from '@wdio/types'

const config: Options.WebdriverIO = {
    hostname: 'http://localhost',
    port: '4444' // Error: Type 'string' is not assignable to type 'number'.ts(2322)
    capabilities: {
        browserName: 'chrome'
    }
}
```

## Поради та хитрощі

### Компіляція & та лінтинг

Щоб бути цілковито безпечним, дотримуватеся найкращих практик: копілюйте свій код за допомогою компілятора TypeScript (запустіть `tsc` або `npx tsc`) і перевіряйте його за допомогою [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) у [pre-commit хуці](https://github.com/typicode/husky).
