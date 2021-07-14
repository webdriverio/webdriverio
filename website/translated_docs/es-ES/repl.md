---
id: repl
title: Interfaz REPL
---

Con `v4.5.0` WebdriverIO introduce una interfaz de [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) que te ayuda a no solo descubrir la API de framework, sino también depurar e inspeccionar tus pruebas. Puede ser usado de múltiples maneras. Primero puede usarlo como comando CLI y generar una sesión WebDriver desde la línea de comandos, p.ej.

```sh
$ wdio repl chrome
```

Esto abriría un navegador Chrome que puede controlar con la interfaz REPL. Asegúrese de que tiene un controlador de navegador en el puerto `4444` para iniciar la sesión. Si tienes una cuenta de [SauceLabs](https://saucelabs.com) (u otra cuenta de vendedor de nubes) también puedes ejecutar directamente el navegador en tu línea de comandos en la nube a través de:

```sh
$ wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

Puede aplicar cualquier opción (vea `wdio --help`) disponible para su sesión REPL.

![WebdriverIO REPL](http://webdriver.io/images/repl.gif)

Otra forma de usar el REPL está entre tus pruebas a través del comando [`debug`](/api/utility/debug.html). Se detendrá el navegador cuando se ejecute y le permite saltar a la aplicación (por ejemplo, a las herramientas de desarrollo) o controlar el navegador desde la línea de comandos. Esto es útil cuando algunos comandos no activan una acción determinada como se esperaba. Con el REPL, puede probar los comandos para ver que están funcionando más confiables.