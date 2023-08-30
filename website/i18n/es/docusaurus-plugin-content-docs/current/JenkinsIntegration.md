---
id: jenkins
title: Jenkins
---

WebdriverIO ofrece una estrecha integración a sistemas de CI como [Bamboo](https://jenkins-ci.org). Con el reportero `junit`, puedes depurar fácilmente tus pruebas así como llevar un seguimiento de los resultados de tus pruebas. La integración es muy sencilla.

1. Instala el reportero de pruebas `junit`: `$ npm install @wdio/junit-reporter --save-dev`)
1. Actualiza tu configuración para guardar los resultados de JUnit donde Bamboo los puede encontrar (y especifica el reportero `junit`:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './'
        }]
    ],
    // ...
}
```

Depende de usted cuál es el marco a elegir. Los informes serán parecidos. Para este tutorial, utilizaremos Jasmine.

Después de haber escrito un par de pruebas, puede configurar un nuevo trabajo en Jenkins. Dale un nombre y una descripción:

![Nombre y descripción](/img/jenkins/jobname.png "Nombre y descripción")

A continuación, asegúrese de capturar siempre la versión más reciente de su repositorio:

![Configuración de Jenkins Git](/img/jenkins/gitsetup.png "Configuración de Jenkins Git")

**Ahora la parte importante:** Crea un paso `de compilación` para ejecutar comandos de shell. El paso de `compilación` necesita construir tu proyecto. Dado que este proyecto de demostración sólo prueba una aplicación externa, no necesitas construir nada. Simplemente instale las dependencias de node y ejecute el comando `npm test` (que es un alias para `node_modules/.bin/wdio test/wdio.conf.js`).

Si ha instalado un plugin como AnsiColor, pero los registros todavía no están coloreados, ejecute pruebas con la variable de entorno `FORCE_COLOR=1` (e.., `FORCE_COLOR=1 prueba npm`).

![Crear paso](/img/jenkins/runjob.png "Crear paso")

Después de tu prueba, querrás que Jenkins realice un seguimiento de tu informe de XUnit. Para ello, tienes que añadir una acción de post-build llamada _"Publicar reporte de resultados de prueba JUnit"_.

También puede instalar un plugin XUnit externo para rastrear sus informes. El JUnit viene con la instalación básica de Jenkins y es suficiente por ahora.

Según el archivo de configuración, los informes XUnit se guardarán en el directorio raíz del proyecto. Estos informes son archivos XML. Por lo tanto, todo lo que necesita hacer para rastrear los informes es apuntar Jenkins a todos los archivos XML en su directorio raíz:

![Acción post-construcción](/img/jenkins/postjob.png "Acción post-construcción")

¡Eso es todo! Ahora ha configurado Jenkins para ejecutar sus tareas WebdriverIO. Su trabajo ahora proporcionará resultados de prueba detallados con gráficos de historial, información de stacktrace sobre trabajos fallidos, y una lista de comandos con payload que se usaron en cada prueba.

![Integración final de Jenkins](/img/jenkins/final.png "Integración final de Jenkins")
