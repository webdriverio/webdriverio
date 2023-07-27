---
id: element
title: El objeto Elemento
---

Un Objeto Elemento es un objeto que representa un Elemento en el agente de usuario remoto, p. ej. un nodo DOM [](https://developer.mozilla.org/en-US/docs/Web/API/Element) al ejecutar una sesión dentro de un navegador o [un elemento móvil](https://developer.apple.com/documentation/swift/sequence/element) para móvil. Puede ser recibido usando uno de los muchos comandos de consulta de elementos, p.ej. [`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) o [`sombras$`](/docs/api/element/shadow$).

## Propiedades

Un objeto navegador tiene las siguientes propiedades:

| Nombre      | Tipo     | Información                                                                                                                                                                                                                                                                    |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sessionId` | `String` | Id de sesión asignado desde el servidor remoto.                                                                                                                                                                                                                                |
| `elementId` | `String` | [referencia de elemento web](https://w3c.github.io/webdriver/#elements) asociada que puede ser usada para interactuar con el elemento en el nivel del protocolo                                                                                                                |
| `selector`  | `String` | [Selector](/docs/selectors) utilizado para consultar el elemento.                                                                                                                                                                                                              |
| `parent`    | `Object` | O bien el [objeto del navegador](/docs/api/browser) cuando el elemento fue obtenido de él (por ejemplo, `const elem = browser. ('selector')`) o un [Objeto de Elementos](/docs/api/element) si fue obtenido desde un ámbito de un elemento (por ejemplo, `elem.$('selector')`) |
| `options`   | `Object` | Se crearon [opciones](/docs/configuration) WebdriverIO, dependiendo de cómo se creó el objeto del navegador. Ver más [tipos de configuración](/docs/setuptypes).                                                                                                               |

## Métodos

Un objeto de elemento proporciona todos los métodos de la sección de protocolo, por ejemplo, el protocolo [WebDriver](/docs/api/webdriver) , así como comandos listados dentro de la sección del elemento. Los comandos de protocolo disponibles dependen del tipo de sesión. Si ejecuta una sesión automatizada en el navegador, ninguno de los comandos [de Appium](/docs/api/appium) estará disponible y vice versa.

Además de que dispone de los siguientes comandos:

| Nombre             | Parámetros                                                            | Información                                                                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to define custom commands that can be called from the browser object for composition purposes. Más información en la guía [Comandos personalizados](/docs/customcommands).                                                           |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | Allows to overwrite any browser command with custom functionality. Utilícelo con cuidado, ya que puede confundir a los usuarios del marco. Lea más en la guía de [Comando Personalizado](/docs/customcommands#overwriting-native-commands). |

## Avisos

### Cadena de Elemento

Al trabajar con elementos WebdriverIO proporciona una sintaxis especial para simplificar la consulta y la búsqueda de elementos anidados complejos compuestos. Como los objetos de elementos le permiten encontrar elementos dentro de su rama de árbol usando métodos de consulta comunes, los usuarios pueden obtener elementos anidados de la siguiente manera:

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

Con estructuras anidadas profundas asignando cualquier elemento anidado a una matriz para luego usarla puede ser bastante detallada. Por eso WebdriverIO tiene concepto de consultas encadenadas de elementos que permiten obtener elementos anidados como este:

```js
console.log(await $('#header').$('#headline').getText())
```

Esto también funciona cuando se obtiene un conjunto de elementos, por ejemplo.:

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

Cuando se trabaja con un conjunto de elementos, esto puede ser especialmente útil al intentar interactuar con ellos, así que en lugar de hacer lo siguiente:

```js
const elems = await $$('div')
const locations = await Promise.all(
    elems.map((el) => el.getLocation())
)
```

Puede llamar directamente a métodos Array en la cadena de elementos, por ejemplo:

```js
const location = await $$('div').map((el) => el.getLocation())
```

WebdriverIO uses a custom implementation that supports asynchronous iteratiors under the hood so all commands from their API are also supported for these use cases.

### Comandos personalizados

Puede configurar comandos personalizados en el ámbito del navegador para abstruir los flujos de trabajo que se usan comúnmente. Consulte nuestra guía en [Comandos personalizados](/docs/customcommands#adding-custom-commands) para más información.
