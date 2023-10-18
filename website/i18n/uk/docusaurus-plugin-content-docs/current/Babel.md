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

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables) or using wdio config's [autoCompileOpts section](configurationfile#autoCompileOpts).
