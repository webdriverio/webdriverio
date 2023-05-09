---
id: babel
title: Налаштування Babel
---

Щоб написати тести із використанням функціоналу JavaScript наступного покоління, ви можете використовувати [Babel](https://babeljs.io) для компіляції файлів тестів.

Для цього спочатку встановіть необхідні залежності Babel:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Переконайтеся, що ваш [`babel.config.js`](https://babeljs.io/docs/en/config-files) правильно налаштований.

Найпростіше налаштування, яке ви можете використовувати:

```js title="babel.config.js"
module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: '14'
            }
        }]
    ]
}
```

Після налаштування WebdriverIO подбає про решту.

Крім того, ви можете налаштувати, як @babel/register працюватиме через змінні середовища для [@babel/register](babel) або за допомогою конфігурації WDIO [autoCompileOpts](configurationfile).
