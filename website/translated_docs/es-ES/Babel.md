---
id: babel
title: Configuración de Babel
---

Para escribir pruebas usando las funciones JavaScript de la próxima generación puedes añadir [Babel](https://babeljs.io/) como compilador para tus archivos de prueba. Primero debe instalar las dependencias necesarias de Babel:

    npm install --save-dev @babel/cli @babel/preset-env @babel/register
    

Asegúrese de que su [`babel.config.js`](https://babeljs.io/docs/en/config-files) está configurado correctamente. La configuración más sencilla que puedes usar es:

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

Hay múltiples formas de configurar Babel usando el testrunner wdio. Si está ejecutando pruebas de Cucumber o Jasmine, sólo necesita registrar Babel en el hook 'before' de su archivo de configuración

```js
before: function() {
    require('@babel/register');
},
```

Si ejecutas pruebas de Mocha, puedes usar el compilador interno de Mocha para registrar Babel, por ejemplo.:

```js
mochaOpts: {
    ui: 'bdd',
    compilers: ['js:@babel/register'],
    require: ['./test/helpers/common.js']
},
```