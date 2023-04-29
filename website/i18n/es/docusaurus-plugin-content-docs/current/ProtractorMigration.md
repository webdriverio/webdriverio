---
id: protractor-migration
title: Desde Protractor
---

Este tutorial es para personas que usan Protractor y desean migrar su marco a WebdriverIO. Se inició después de que el equipo de Angular [ha anunciado](https://github.com/angular/protractor/issues/5502) que el Protractor no será soportado por más tiempo. WebdriverIO se ha visto influenciado por un montón de decisiones de diseño Protractores, por lo que es probablemente el marco más cercano a migrar. El equipo de WebdriverIO aprecia el trabajo de cada colaborador de Protractor y espera que este tutorial haga la transición a WebdriverIO fácil y sencilla.

Si bien nos encantaría tener un proceso completamente automatizado para esto, la realidad es diferente. Todos tienen una configuración diferente y usan el protractor de diferentes maneras. Cada paso debe ser visto como guía y menos como una instrucción paso a paso. Si tiene problemas con la migración, no dude en [contactarnos](https://github.com/webdriverio/codemod/discussions/new).

## Configuración

La API Protractor y WebdriverIO es en realidad muy similar, hasta un punto en el que la mayoría de los comandos pueden reescribirse de forma automatizada a través de un [codemod](https://github.com/webdriverio/codemod).

Para instalar la códemod, ejecute:

```sh
npm install jscodeshift @wdio/codemod
```

## Estrategia

Existen muchas estrategias de migración. Dependiendo del tamaño de tu equipo, cantidad de archivos de prueba y la urgencia de migrar puede tratar de transformar todas las pruebas a la vez o archivo por archivo. Dado que Protractor continuará siendo mantenido hasta la versión 15 de Angular (finales de 2022) todavía tiene tiempo suficiente. Puede tener pruebas de Protractor y WebdriverIO funcionando al mismo tiempo y comenzar a escribir nuevas pruebas en WebdriverIO. Dada su presupuesto de tiempo puede comenzar a migrar los casos de prueba importantes primero y hacer su camino hacia las pruebas que puede incluso eliminar.

## Primero el archivo de configuración

Después de haber instalado el código podemos comenzar a transformar el primer archivo. Eche un vistazo primero a [opciones de configuración de WebdriverIOs](configuration). Los archivos de configuración pueden llegar a ser muy complejos y podría tener sentido portar sólo las partes esenciales y ver cómo se puede agregar el resto una vez que se están migrando las pruebas correspondientes que necesitan ciertas opciones.

Para la primera migración, sólo transformamos el archivo de configuración y ejecutamos:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./conf.ts
```

:::info

 Su configuración puede ser nombrada de forma diferente, sin embargo el principio debe ser el mismo: iniciar la migración de la configuración primero.

:::

## Actualizar dependencias de WebdriverIO

El siguiente paso es configurar una configuración mínima de WebdriverIO que comenzamos a construir a medida que migramos de un marco a otro. Primero instalamos WebdriverIO CLI vía:

```sh
npm install --save-dev @wdio/cli
```

A continuación ejecutamos el asistente de configuración:

```sh
npx wdio config
```

Esto le guiará a través de un par de preguntas. Para este escenario de migración:
- elija las opciones predeterminadas
- recomendamos no generar automáticamente archivos de ejemplo
- elija una carpeta diferente para los archivos WebdriverIO
- y elegir Mocha por encima de Jasmine.

Aunque es posible que haya estado usando Protractor con Jasmine antes, Mocha proporciona mejores mecanismos de reintento. ¡La elección es suya!
:::  
:::
:::

Después del pequeño cuestionario, el asistente instalará todos los paquetes necesarios y los almacenará en su `package.json`.

## Migrar archivo de configuración

Después de haber transformado `conf.ts` y un nuevo `wdio.conf. s`, ahora es hora de migrar la configuración de una configuración a otra. Asegúrese de portar solo el código que es esencial para que todas las pruebas puedan ejecutarse. En el nuestro, portamos la función gancho y tiempo de espera del framework.

Ahora continuaremos con nuestro archivo `wdio.conf.ts` sólo y por lo tanto no necesitaremos más cambios en la configuración original del Protractor. Podemos revertirlos para que ambos frameworks puedan correr uno junto al otro y podamos portar el archivo en el momento.

## Migrar archivo de prueba

Ahora estamos configurados para portar sobre el primer archivo de prueba. Para empezar sencillamente, empecemos con una que no tenga muchas dependencias de paquetes de terceros u otros archivos como PageObjects. En nuestro ejemplo el primer archivo a migrar es `first-test.spec.ts`. Primero cree el directorio donde la nueva configuración de WebdriverIO espera sus archivos y luego muévelo sobre ello:

```sh
mv mkdir -p ./test/specs/
mv test-suites/first-test.spec.ts ./test/specs
```

Ahora transformemos el archivo:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./test/specs/first-test.spec.ts
```

¡Ya está! Este archivo es tan simple que no necesitamos más cambios adicionales y directamente podemos intentar ejecutar WebdriverIO vía:

```sh
npx wdio run wdio.conf.ts
```

Felicidades 🥳 ¡acaba de migrar el primer archivo!

## Siguientes pasos

A partir de este punto usted continúa transformando prueba por prueba y objeto de página por objeto página. Existe la posibilidad de que el código falle para ciertos archivos con un error como:

```
ERR /path/to/project/test/testdata/failing_submit.js Transformation error (Error transforming /test/testdata/failing_submit.js:2)
Error transforming /test/testdata/failing_submit.js:2

> login_form.submit()
  ^

The command "submit" is not supported in WebdriverIO. Recomendamos utilizar el comando de clic para hacer clic en el botón Enviar en su lugar. Para obtener más información sobre esta configuración, consulte https://webdriver.io/docs/api/element/click.
  at /path/to/project/test/testdata/failing_submit.js:132:0
```

Para algunos comandos de Protractor no hay reemplazo para ello en WebdriverIO. En este caso el código le dará algunos consejos para refactorizarla. Si se tropieza con estos mensajes de error con demasiada frecuencia, siéntete libre de [plantear un problema](https://github.com/webdriverio/codemod/issues/new) y solicitar que se añada una cierta transforma. Aunque el código ya transforma la mayoría de la API de Protractor todavía hay mucho espacio para mejoras.

## Conclusión

Esperamos que este tutorial le guie un poco a través del proceso de migración a WebdriverIO. La comunidad continúa mejorando el canon mientras lo prueba con varios equipos en diversas organizaciones. No dudes en [plantear una cuestión](https://github.com/webdriverio/codemod/issues/new) si tienes comentarios o [inicia una discusión](https://github.com/webdriverio/codemod/discussions/new) si luchas durante el proceso de migración.
