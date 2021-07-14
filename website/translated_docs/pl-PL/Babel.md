---
id: babel
title: Konfiguracja Babela
---

By pisać testy przy użyciu funkcji następnej generacji JavaScriptu, możesz użyć [Babel'a](https://babeljs.io/) jako kompilatora dla plików testowych. W tym celu zainstaluj niezbędne zależności Babel'a:

    npm install --save-dev @babel/cli @babel/preset-env @babel/register
    

Upewnij się, że twój [`babel.config.js`](https://babeljs.io/docs/en/config-files) jest poprawnie skonfigurowany. Najprostsza konfiguracja, której możesz użyć:

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

Istnieje wiele sposobów konfiguracji Babel'a do używania testrunnera wdio. Jeśli używasz frameworka Cucumber lub Jasmine, wystarczy zarejestrować Babel w wywołaniu `before` w pliku konfiguracyjnym

```js
before: function() {
    require('@babel/register');
},
```

Jeśli uruchamiasz testy Mocha, możesz użyć wewnętrznego kompilatora Mocha'i by zarejestrować Babela. Na przykład:

```js
mochaOpts: {
    ui: 'bdd',
    compilers: ['js:@babel/register'],
    require: ['./test/helpers/common.js']
},
```