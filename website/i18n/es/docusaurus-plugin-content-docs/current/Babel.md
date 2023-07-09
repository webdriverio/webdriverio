---
id: babel
title: Configuración de Babel
---

Para escribir pruebas usando características JavaScript de próxima generación, puede usar [Babel](https://babeljs.io) para compilar sus archivos de prueba.

Para hacerlo, primero instale las dependencias necesarias de Babel:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Asegúrese de que su [`babel.config.js`](https://babeljs.io/docs/en/config-files) esté configurado correctamente.

La configuración más sencilla que puedes usar es:

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

Una vez que se haya configurado WebdriverIO se encargará del resto.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables) or using wdio config's [autoCompileOpts section](configurationfile#autoCompileOpts).
