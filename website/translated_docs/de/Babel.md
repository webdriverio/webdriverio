---
id: babel
title: Babel-Setup
---

Um Ihre Tests mit all den letzten JavaScript Funktionen schreiben zu können, verwenden Sie [Babel](https://babeljs.io/) als Compiler. Dafür installieren Sie zuerst alle benötigten Babel Module:

    npm install --save-dev @babel/cli @babel/preset-env @babel/register
    

Vergewissern Sie sich, dass Ihre [`babel.config.js`](https://babeljs.io/docs/en/config-files) richtig konfiguriert ist. Das folgende Beispiel zeigt das einfachst mögliche Setup:

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

Es gibt mehrere Möglichkeiten, Babel mit dem WDIO Testrunner einzurichten. Wenn Sie Cucumber oder Jasmine-Tests ausführen, müssen Sie Babel nur in der Hook Ihrer Konfigurationsdatei registrieren:

```js
before: function() {
    require('@babel/register');
},
```

Wenn Sie Mocha-Tests ausführen, können Sie den internen Compiler von Mocha verwenden, um Babel zu registrieren, z.B.:

```js
mochaOpts: {
    ui: 'bdd',
    compilers: ['js:@babel/register'],
    require: ['./test/helpers/common.js']
},
```