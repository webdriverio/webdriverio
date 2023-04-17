---
id: environment
title: Variables de entorno
---

WebdriverIO establece las siguientes variables de entorno en cada trabajador:

## `NODE_ENV`

Establezca el valor `'test'` si no se ha establecido ya a otra cosa.

## `WDIO_LOG_LEVEL`

Can be set to values `trace`, `debug`, `info`, `warn`, `error`, `silent` to write logs with corresponding details. Has priority over the passed `logLevel` value.

## `WDIO_WORKER_ID`

Un id único que ayuda a identificar el proceso del trabajador. Tiene el formato de `{number}-{number}` donde el primer número identifica la capacidad y el segundo el archivo de especificaciones que esa capacidad está ejecutando, por ejemplo `0-5` indica un trabajador el primero ejecutando el 6º archivo de especificaciones para la primera capacidad.
