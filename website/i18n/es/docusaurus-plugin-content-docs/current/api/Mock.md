---
id: mock
title: El objeto simulado
---

El objeto simulado es un objeto que representa una simulación de red y contiene información sobre las solicitudes que coinciden con `url` y `filterOptions` dadas. Puede ser recibido usando el comando [`mock`](/docs/api/browser/mock).

:::info

Tenga en cuenta que usar el comando `mock` requiere soporte para el protocolo de Chrome DevTools. Ese soporte se da si ejecuta las pruebas localmente en el navegador basado en Chromium o si usas una cuadrícula Selenium v4 o superior. Este comando no puede ____ utilizarse al ejecutar pruebas automatizadas en la nube. Obtenga más información en la sección de [Protocoles de Automatización](/docs/automationProtocols).

:::

Puede leer más acerca de las solicitudes de simulación y respuestas en WebdriverIO en nuestra guía [Mocks y espías](/docs/mocksandspies).

## Properties

Un objeto simulado contiene las siguientes propiedades:

| Nombre          | Tipo       | Información                                                                                                                                                                           |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | `String`   | The url passed into the mock command                                                                                                                                                  |
| `filterOptions` | `Object`   | The resource filter options passed into the mock command                                                                                                                              |
| `browser`       | `Object`   | The [Browser Object](/docs/api/browser) used to get the mock object.                                                                                                                  |
| `matches`       | `Object[]` | Information about matching browser requests, containing properties such as `url`, `method`, `headers`, `initialPriority`, `referrerPolic`, `statusCode`, `responseHeaders` and `body` |

## Métodos

Mock objects provide various commands, listed in the `mock` section, that allow users to modify the behavior of the request or response.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOne`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)
