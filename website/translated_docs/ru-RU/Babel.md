---
id: babel
title: Настройка Babel
---

Чтобы писать тесты, используя функции JavaScript следующего поколения, вы можете добавить [Babel](https://babeljs.io/) в качестве компилятора для ваших тестовых файлов. Для этого во-первых установите необходимые зависимости Babel:

    npm install --save-dev @babel/cli @babel/preset-env @babel/register
    

Убедитесь, что ваш [`babel.config.js`](https://babeljs.io/docs/en/config-files) настроен правильно. Простая настройка, которую вы можете использовать:

```js
module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 8
            }
        }]
    ]
}
```

Существует несколько способов настройки Babel с помощью Wdio Testrunner. Если вы используете тесты Cucumber или Jasmine, вам просто нужно зарегистрировать Babel в before hook в вашем конфигурационном файле

```js
before: function() {
    require('@babel/register');
},
```

Если вы запускаете Mocha тесты, вы можете использовать внутренний компилятор Mocha для регистрации Babel, например:

```js
mochaOpts: {
    ui: 'bdd',
    compilers: ['js:@babel/register'],
    require: ['./test/helpers/common.js']
},
```