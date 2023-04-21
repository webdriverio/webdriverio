---
id: bamboo
title: Bamboo
---

WebdriverIO ofrece una estrecha integración a sistemas de CI como [Bamboo](https://www.atlassian.com/software/bamboo). Con el reportero [JUnit](https://webdriver.io/docs/junit-reporter.html) o [Allure](https://webdriver.io/docs/allure-reporter.html) , puede depurar fácilmente sus pruebas así como llevar un seguimiento de sus resultados de prueba. La integración es muy sencilla.

1. Instalar el reportero de pruebas JUnit: `$ npm install @wdio/junit-reporter --save-dev`)
1. Actualiza tu configuración para guardar los resultados de JUnit donde Bamboo los puede encontrar (y especifica el reportero `junit`.

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/'
        }]
    ],
    // ...
}
```
Nota: *Siempre es un buen estándar mantener los resultados de las pruebas en carpeta separada que en la carpeta raíz.*

```js
// wdio.conf.js - For tests running in parallel
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/',
            outputFileFormat: function (options) {
                return `results-${options.cid}.xml`;
            }
        }]
    ],
    // ...
}
```

Los reportes serán similares para todos los frameworks y usted puede usar a cualquier persona: Mocha, Jasmine o Cucumber.

Para este momento, creemos que tiene las pruebas escritas y los resultados se generan en `. testresults/` carpeta, y su Bamboo está en ejecución.

## Integre sus pruebas en Bamboo

1. Abra su proyecto en Bamboo

    > Cree un nuevo plan, vincule su repositorio (asegúrese de que siempre apunta a la versión más reciente de su repositorio) y cree sus etapas

    ![Detalles del plan](/img/bamboo/plancreation.png "Detalles del plan")

    Irá con la etapa y el trabajo por defecto. En su caso, puede crear sus propias etapas y trabajos

    ![Etapa por defecto](/img/bamboo/defaultstage.png "Etapa por defecto")
2. Abra su trabajo de pruebas y cree tareas para ejecutar sus pruebas en Bamboo
> **Tarea 1:** Código fuente de compra
> **Tarea 1:** Código fuente de compra **Tarea 1:** Código fuente de compra **Tarea 1:** Código fuente de compra **Tarea 2:** Ejecute sus pruebas `npm i && npm run test`. Puede utilizar la tarea *Script* y *Shell Interpreter* para ejecutar los comandos anteriores (esto generará los resultados de la prueba y los guardará en `. carpetas testresults/`)

    ![Prueba de ejecución](/img/bamboo/testrun.png "Prueba de ejecución")
> **Tarea: 3** Añada tarea *analizador jUnit* para analizar los resultados guardados de la prueba. Por favor especifique el directorio de resultados de prueba aquí (también puede usar patrones de estilo Ant)

    ![jUnit Parser](/img/bamboo/junitparser.png "jUnit Parser")

    Nota: *Asegúrese de que está manteniendo la tarea de analizador de resultados en la sección *Final* , para que siempre se ejecute incluso si su tarea de prueba es fallida*
> **Tarea: 4** (opcional) para asegurarse de que los resultados de la prueba no están mal con los archivos antiguos. puedes crear una tarea para remover la `. testresults/` carpeta tras un análisis exitoso de Bamboo. Puede agregar un script de shell como `rm -f ./testresults/*. ml` para eliminar los resultados o `rm -r testresults` para quitar la carpeta completa

Una vez que haya terminado la *ciencia del cohete* de arriba, habilite el plan y ejecutarlo. Su salida final será así:

## Prueba correcta

![Prueba correcta](/img/bamboo/successfulltest.png "Prueba correcta")

## Prueba fallida

![Prueba fallida](/img/bamboo/failedtest.png "Prueba fallida")

## Fallida y corregida

![Fallida y corregida](/img/bamboo/failedandfixed.png "Fallida y corregida")

¡Genial! ¡Genial! Es todo. Usted ha integrado con éxito sus pruebas de WebdriverIO en Bamboo.
