---
id: babel
title: Babel-Setup
---

Um Tests mit neuartigen JavaScript-Funktionen zu schreiben, können Sie [Babel](https://babeljs.io) verwenden, um Ihre Testdateien zu kompilieren.

Installieren Sie dazu zunächst die notwendigen Babel-Abhängigkeiten:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Stellen Sie sicher, dass Ihre [`babel.config.js`](https://babeljs.io/docs/en/config-files) richtig konfiguriert ist.

Das einfachste Setup, das Sie verwenden können, ist:

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

Sobald dies eingerichtet ist, kümmert sich WebdriverIO um den Rest.

Alternativ können Sie konfigurieren, wie @babel/register ausgeführt wird, über die Umgebungsvariablen für [@babel/register](https://babeljs.io/docs/babel-register#environment-variables) oder mit wdio config's [autoCompileOpts section](configurationfile#autoCompileOpts).
