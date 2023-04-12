---
id: babel
title: Configuración de Babel
---

Para escribir pruebas usando características JavaScript de próxima generación, puede usar [Babel](https://babeljs.io) para compilar sus archivos de prueba.

Para hacerlo, primero instale las dependencias necesarias de Babel:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Make sure your [`babel.config.js`](https://babeljs.io/docs/en/config-files) is configured properly.

The simplest setup you can use is:

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

Once this is set up WebdriverIO will take care of the rest.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](Babel.md) or using wdio config's [autoCompileOpts section](ConfigurationFile.md).
