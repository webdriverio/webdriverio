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
                node: '20' // update with the target you are aiming for
            }
        }]
    ]
}
```

When using Babel in a monorepo things can get complicated if you do not follow the documentation steps, so make sure you read the [Babel documentation](https://babeljs.io/docs/config-files#monorepos) thoroughly.

To give you some guidance, here's some things to keep in mind:
- You have to create a [root babel.config.json](https://babeljs.io/docs/config-files#root-babelconfigjson-file).
- After you have done so and the project is correctly configured according to the documentation, you will have to make Babel look for the config by updating your wdio config files by adding the example found below.

```js
require("@babel/register")({
  rootMode: "upward",
});
```

This will make Babel look for the closest `babel.config.json` that it can find upwards.

Una vez que se haya configurado WebdriverIO se encargará del resto.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables).
