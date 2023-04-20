---
id: selectors
title: Selectores
---

El [Protocolo WebDriver](https://w3c.github.io/webdriver/) proporciona varias estrategias de selección para consultar un elemento. WebdriverIO los simplifica para seguir seleccionando elementos simples. Tenga en cuenta que aunque el comando para consultar elementos se llama `$` y `$$`, no tienen nada que ver con jQuery o el [Sizzle Selector Engine](https://github.com/jquery/sizzle).

Si bien hay tantos selectores diferentes disponibles, solo algunos de ellos brindan una forma resistente de encontrar el elemento correcto. Por ejemplo, el siguiente botón:

```html
<button
  id="main"
  class="btn btn-large"
  name="submission"
  role="button"
  data-testid="submit"
>
  Submit
</button>
```

Nosotros __hacemos__ y __no__ recomendamos los siguientes selectores:

| Selector                                      | Recomendado     | Observaciones                                                              |
| --------------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| `$('button')`                                 | 🚨 Nunca         | El peor - demasiado genérico, sin contexto.                                |
| `$('.btn.btn-large')`                         | 🚨 Nunca         | Malo. Unido al estilismo. Muy sujeto a cambios.                            |
| `$('#main')`                                  | ⚠️ Parcialmente | Media-baja. Pero todavía se unieron a los oyentes de estilos o eventos JS. |
| `$(() => document.queryElement('button'))` | ⚠️ Parcialmente | Consulta efectiva, compleja de escribir.                                   |
| `$('button[name="submission"]')`              | ⚠️ Parcialmente | Acoplado al atributo `nombre` que tiene semántica HTML.                    |
| `$('button[data-testid="submit"]')`           | ✅ Bueno         | Requiere atributo adicional, no conectado al a11y.                         |
| `$('aria/Submit')` or `$('button=Submit')`    | ✅ El mejor      | Óptimo. Se asemeja a cómo el usuario interactúa con la página.             |

## Selector de consultas CSS

Si no se indica lo contrario, WebdriverIO consultará elementos usando el patrón de [selector CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors), por ejemplo.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L7-L8
```

## Texto del enlace

Para obtener un elemento de anclaje con un texto específico en él, consulta el texto que comienza con un signo igual (`=`).

Por ejemplo:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L3
```

Puede consultar este elemento llamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L16-L18
```

## Texto de enlace parcial

Para encontrar un elemento de ancla cuyo texto visible coincide parcialmente con el valor de búsqueda, consulta usando `*=` delante de la cadena de consulta (e.. `*=driver`).

Puede consultar el elemento del ejemplo anterior llamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L24-L26
```

__Nota:__ No puedes mezclar múltiples estrategias de selector en un selector. Usar múltiples consultas encadenadas de elementos para alcanzar el mismo objetivo, por ejemplo.:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('*=driver')
```

## Elemento con un texto determinado

También se puede aplicar la misma técnica a los elementos.

Por ejemplo, aquí hay una consulta para un encabezado de nivel 1 con el texto "Bienvenido a mi página":

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L2
```

Puede consultar este elemento llamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L35-L36
```

O usando texto parcial de la consulta:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L42-L43
```

Lo mismo funciona para los nombres de la clase `id` y ``:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L4
```

Puede consultar este elemento llamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L45-L55
```

__Nota:__ No puede mezclar múltiples estrategias de selector en un selector. Usar múltiples consultas encadenadas de elementos para alcanzar el mismo objetivo, por ejemplo.:

```js
const elem = await $('header h1*=Welcome') // doesn't work!!!
// use instead
const elem = await $('header').$('h1*=Welcome')
```

## Nombre de la etiqueta

Para consultar un elemento con un nombre de etiqueta específico, usa `<tag>` o `<tag />`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L5
```

Puede consultar este elemento llamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L61-L62
```

## Atributo del nombre

Para consultar elementos con un atributo de nombre específico puedes usar un selector CSS3 normal o la estrategia de nombres proporcionada desde el [JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) pasando algo como [name="some-name"] como parámetro de selector:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L68-L69
```

__Nota:__ Esta estrategia de selector está obsoleta y solo funciona en un navegador antiguo que se ejecuta por el protocolo JSONWireProtocol o usando Appium.

## xPath

También es posible consultar elementos a través de un [xPath](https://developer.mozilla.org/en-US/docs/Web/XPath) específico.

Un selector xPath tiene un formato como `//body/div[6]/div[1]/span[1]`.

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/xpath.html
```

Puede consultar el segundo párrafo llamando:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L75-L76
```

Puedes usar xPath para recorrer arriba y abajo del DOM:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L78-L79
```

## Selector de Nombre de Accesibilidad

Consultar elementos por su nombre accesible. El nombre accesible es lo que anuncia un lector de pantalla cuando ese elemento recibe el foco. El valor del nombre accesible puede ser tanto contenido visual como texto alternativo oculto.

:::info

Puedes leer más sobre este selector en nuestra [publicación del blog](/blog/2022/09/05/accessibility-selector)

:::

### Buscar por `aria-label`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L1
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L86-L87
```

### Buscar por `aria-labelledby`

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L2-L3
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L93-L94
```

### Buscar por contenido

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L4
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L100-L101
```

### Buscar por título

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L5
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L107-L108
```

### Buscar por `alt` propiedad

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L6
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L114-L115
```

## Atributo ARIA - Rol

Para consultar elementos basados en [roles ARIA](https://www.w3.org/TR/html-aria/#docconformance), puede especificar directamente el rol del elemento como `[role=button]` como parámetro selector:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/aria.html#L13
```

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L131-L132
```

## Atributo ID

La estrategia de localización "id" no está soportada en el protocolo WebDriver, uno debe utilizar las estrategias de selector CSS o xPath en su lugar para encontrar elementos usando ID.

Sin embargo, algunos controladores (por ejemplo, [Appium You.i Engine Driver](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies)) todavía podrían [soportar](https://github.com/YOU-i-Labs/appium-youiengine-driver#selector-strategies) este selector.

Las sintaxis de selector soportadas actualmente para ID son:

```js
//css locator
const button = await $('#someid')
//xpath locator
const button = await $('//*[@id="someid"]')
//id strategy
// Note: works only in Appium or similar frameworks which supports locator strategy "ID"
const button = await $('id=resource-id/iosname')
```

## Función JS

También puede utilizar funciones JavaScript para obtener elementos usando APIs web nativas. Por supuesto, sólo se puede hacer dentro de un contexto web (por ejemplo, `navegador`o contexto web en móvil).

Dada la siguiente estructura HTML:

```html reference
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/js.html
```

Puedes consultar el elemento hermano de `#elem` de la siguiente manera:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L139-L143
```

## Selectores

Muchas aplicaciones de frontend dependen en gran medida de elementos con [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM). Es técnicamente imposible consultar elementos dentro del DOM alternativo sin workarounds. La [`sombrea$`](https://webdriver.io/docs/api/element/shadow$) y [`sombrea$$`](https://webdriver.io/docs/api/element/shadow$$) han sido tales soluciones que tenían sus [limitaciones](https://github.com/Georgegriff/query-selector-shadow-dom#how-is-this-different-to-shadow). Con el selector profundo ahora puede consultar todos los elementos dentro de cualquier DOM sombra usando el comando de consulta común.

Dado que tenemos una aplicación con la siguiente estructura:

![Ejemplo Chrome](https://github.com/Georgegriff/query-selector-shadow-dom/raw/main/Chrome-example.png "Ejemplo Chrome")

Con este selector puedes consultar el elemento `<button />` que está anidado dentro de otro DOM, por ejemplo.:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/selectors/example.js#L147-L149
```

## Selectores móviles

Para pruebas móviles híbridas, es importante que el servidor de automatización se encuentre en el *contexto* correcto antes de ejecutar comandos. Para los gestos de automatización, el controlador idealmente debería establecerse en contexto nativo. Pero para seleccionar elementos del DOM, el controlador tendrá que configurarse en el contexto de la vista web de la plataforma. Sólo *entonces* se pueden utilizar los métodos mencionados anteriormente.

Para las pruebas móviles nativas, no hay cambio entre contextos, ya que tiene que utilizar estrategias móviles y utilizar directamente la tecnología de automatización de dispositivos subyacente. Esto es especialmente útil cuando una prueba necesita algún control fino sobre la búsqueda de elementos.

### Android UiAutomator

El framework de Android UI Automator proporciona varias maneras de encontrar elementos. Puede utilizar la [API de Automador de interfaz](https://developer.android.com/tools/testing-support-library/index.html#uia-apis), en particular la [clase UiSelector](https://developer.android.com/reference/androidx/test/uiautomator/UiSelector) para localizar elementos. En Appium se envía el código Java, como una cadena, al servidor, que lo ejecuta en el entorno de la aplicación, devolviendo el elemento o elementos.

```js
const selector = 'new UiSelector().text("Cancel").className("android.widget.Button")'
const button = await $(`android=${selector}`)
await button.click()
```

### Android DataMatcher y ViewMatcher (sólo Espresso)

La estrategia DataMatcher de Android proporciona una manera de encontrar elementos por [Data Matcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"]
})
await menuItem.click()
```

Y similarmente [Ver Matcher](https://developer.android.com/reference/android/support/test/espresso/ViewInteraction)

```js
const menuItem = await $({
  "name": "hasEntry",
  "args": ["title", "ViewTitle"],
  "class": "androidx.test.espresso.matcher.ViewMatchers"
})
await menuItem.click()
```

### Etiqueta de visualización de Android (solo Espresso)

La estrategia de la etiqueta vista proporciona una manera conveniente de encontrar elementos por su etiqueta [](https://developer.android.com/reference/android/support/test/espresso/matcher/ViewMatchers.html#withTagValue%28org.hamcrest.Matcher%3Cjava.lang.Object%3E%29).

```js
const elem = await $('-android viewtag:tag_identifier')
await elem.click()
```

### iOS UIAutomation

Al automatizar una aplicación iOS, el [framework de automatización de interfaz](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html) de Apple puede utilizarse para encontrar elementos.

Esta [API de JavaScript](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/index.html#//apple_ref/doc/uid/TP40009771) tiene métodos para acceder a la vista y todo en ella.

```js
const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
const button = await $(`ios=${selector}`)
await button.click()
```

También puede utilizar la búsqueda de predicados dentro de iOS UI Automation en Appium para refinar aún más la selección de elementos. Ver [aquí](https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/ios/ios-predicate.md) para más detalles.

### cadenas de predicado y cadenas de clases de iOS XCUITest

Con iOS 10 o superior (usando el controlador `XCUITest`), puedes usar [cadenas predicadas](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules):

```js
const selector = `type == 'XCUIElementTypeSwitch' && name CONTAINS 'Allow'`
const switch = await $(`-ios predicate string:${selector}`)
await switch.click()
```

Y [cadenas de clases](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules):

```js
const selector = '**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton'
const button = await $(`-ios class chain:${selector}`)
await button.click()
```

### Accessibility ID

La estrategia de localización de `identificador de accesibilidad` está diseñada para leer un identificador único para un elemento de interfaz de usuario. Esto tiene el beneficio de no cambiar durante la localización o cualquier otro proceso que pueda cambiar el texto. Además, puede ser una ayuda para la creación de pruebas multiplataforma, si los elementos que funcionen igual tienen el mismo identificador de accesibilidad.

- Para iOS este es el `identificador de accesibilidad` diseñado por Apple [aquí](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIAccessibilityIdentification_Protocol/index.html).
- Para Android el `id de accesibilidad` se mapea a la `descripción de contenido` para el elemento, como se describe [aquí](https://developer.android.com/training/accessibility/accessible-app.html).

Para ambas plataformas, obtener un elemento (o múltiples elementos) por su `identificador de accesibilidad` es generalmente el mejor método. También es la forma preferida sobre la estrategia de `nombre` desaprobada.

```js
const elem = await $('~my_accessibility_identifier')
await elem.click()
```

### Nombre de clase

La estrategia `nombre de clase` es una `cadena` que representa un elemento de la interfaz de usuario en la vista actual.

- Para iOS es el nombre completo de una clase de [UIAutomation](https://developer.apple.com/library/prerelease/tvos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/UIAutomation.html), y comenzará con `UIA-`, como `UIATextField` para un campo de texto. Se puede encontrar una referencia completa [aquí](https://developer.apple.com/library/ios/navigation/#section=Frameworks&topic=UIAutomation).
- Para Android es el nombre completo de una clase [UI Automator](https://developer.android.com/tools/testing-support-library/index.html#UIAutomator) [](https://developer.android.com/reference/android/widget/package-summary.html), como `android. idget.EditText` para el campo de texto. Se puede encontrar una referencia completa [aquí](https://developer.android.com/reference/android/widget/package-summary.html).
- Para Youi.tv es el nombre completo de un Youi. clase v, y estará con `CYI-`, como `CYIPushButtonView` para un elemento del botón pulsado. Puedes encontrar una referencia completa en [la página de GitHub del Motivador de Motores You.i](https://github.com/YOU-i-Labs/appium-youiengine-driver)

```js
// iOS example
await $('UIATextField').click()
// Android example
await $('android.widget.DatePicker').click()
// Youi.tv example
await $('CYIPushButtonView').click()
```

## Selectores de Cadena

Si desea ser más específico en su consulta, puede encadenar selectores hasta que encuentre el elemento correcto. Si llama `elemento` antes de su comando real, WebdriverIO inicia la consulta desde ese elemento.

Por ejemplo, si tiene una estructura DOM:

```html
<div class="row">
  <div class="entry">
    <label>Product A</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product B</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product C</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
</div>
```

Y quiere añadir el producto B al carrito, sería difícil hacerlo sólo usando el selector CSS.

Con la cadena de selectos, es mucho más fácil. Simplemente delimite el elemento deseado paso a paso:

```js
await $('.row .entry:nth-child(2)').$('button*=Add').click()
```

### Selector de imagen de Appium

Utilizando la estrategia de localización de  `-image`, es posible enviar un Appium un archivo de imagen que representa un elemento al que desea acceder.

Formatos de archivo compatibles `jpg,png,gif,bmp,svg`

Se puede encontrar una referencia completa [aquí](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md)

```js
const elem = await $('./file/path/of/image/test.jpg')
await elem.click()
```

**Nota**: La forma en que funciona Appium con este selector es que internamente hará una captura de pantalla (app)y usará el selector de imagen proporcionado para verificar si el elemento puede encontrarse en esa captura de pantalla (app).

Tenga en cuenta el hecho de que Appium podría cambiar el tamaño de la captura de pantalla tomada (aplicación) para que coincida con el tamaño CSS de su pantalla (aplicación) (esto sucederá en iPhones pero también en máquinas Mac con una pantalla Retina porque el DPR es más grande que 1). Esto resultará en no encontrar coincidencias porque el selector de imagen proporcionado podría haber sido tomado de la captura de pantalla original. Puede solucionar esto actualizando la configuración del servidor Appium, consulte los [documentos de Appium](https://github.com/appium/appium/blob/master/docs/en/advanced-concepts/image-elements.md#related-settings) para conocer la configuración y [este comentario](https://github.com/webdriverio/webdriverio/issues/6097#issuecomment-726675579) para obtener una explicación detallada.

## Selectores de Cadena

WebdriverIO proporciona una manera de seleccionar componentes React basados en el nombre del componente. Para hacer esto, tienes una elección de dos comandos: `react$` y `react$$`.

Estos comandos le permiten seleccionar componentes del [React VirtualDOM](https://reactjs.org/docs/faq-internals.html) y devolver un solo elemento WebdriverIO o un array de elementos (dependiendo de qué función se use).

**Nota**: Los comandos `react$` y `react$$` son similares en funcionalidad, excepto que `react$$` devolverá *todas las* instancias coincidentes como un array de elementos WebdriverIO, y `react$` retornará la primera instancia encontrada.

#### Ejemplo básico

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <div>
            MyComponent
        </div>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

En el código anterior hay una simple instancia de `MyComponent` dentro de la aplicación, que React se está renderizando dentro de un elemento HTML con `id="root"`.

Con el comando `browser.react$`, puede seleccionar una instancia de `MyComponent`:

```js
const myCmp = await browser.react$('MyComponent')
```

Ahora que tiene el elemento WebdriverIO almacenado en la variable `myCmp`, puede ejecutar comandos de elemento en su contra.

#### Componentes de filtrado

La biblioteca que usa internamente WebdriverIO permite filtrar su selección por accesorios y/o estado del componente. Para ello, necesita pasar un segundo argumento para props y/o un tercer argumento para el estado al comando del navegador.

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent(props) {
    return (
        <div>
            Hello { props.name || 'World' }!
        </div>
    )
}

function App() {
    return (
        <div>
            <MyComponent name="WebdriverIO" />
            <MyComponent />
        </div>
    )
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

Si desea seleccionar la instancia de `MyComponent` que tiene un nombre de accesorio `` como `WebdriverIO`, puedes ejecutar el comando así:

```js
const myCmp = await browser.react$('MyComponent', {
    props: { name: 'WebdriverIO' }
})
```

Si quisiera filtrar nuestra selección por estado, el comando `browser` se vería así:

```js
const myCmp = await browser.react$('MyComponent', {
    state: { myState: 'some value' }
})
```

#### Abordando con `React.Fragment`

Al usar el comando `react$` para seleccionar fragmentos [de React](https://reactjs.org/docs/fragments.html), WebdriverIO devolverá el primer hijo de ese componente como nodo del componente. Si utiliza `react$$`, recibirá un arreglo que contiene todos los nodos HTML dentro de los fragmentos que coincidan con el selector.

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom'

function MyComponent() {
    return (
        <React.Fragment>
            <div>
                MyComponent
            </div>
            <div>
                MyComponent
            </div>
        </React.Fragment>
    )
}

function App() {
    return (<MyComponent />)
}

ReactDOM.render(<App />, document.querySelector('#root'))
```

Dado el ejemplo anterior, así es como funcionarían los comandos:

```js
await browser.react$('MyComponent') // returns the WebdriverIO Element for the first <div />
await browser.react$$('MyComponent') // returns the WebdriverIO Elements for the array [<div />, <div />]
```

**Nota:** Si tiene varias instancias de `MyComponent` y usa `react$$` para seleccionar estos componentes de fragmento, obtendrá una matriz unidimensional de todos los nodos. En otras palabras, si tiene 3 `<MyComponent />` instancias, se le devolverá una matriz con seis elementos WebdriverIO.

## Estrategias de selección personalizadas

Si su aplicación requiere una forma específica de obtener elementos, puede definir una estrategia de selección personalizada que puede usar con `custom$` y `custom$$`. Para eso registre su estrategia una vez al comienzo de la prueba:

```js
browser.addLocatorStrategy('myCustomStrategy', (selector, root) => {
    /**
     * scope should be document if called on browser object
     * and `root` if called on an element object
     */
    const scope = root ? root : document
    return scope.querySelectorAll(selector)
})
```

Dado el siguiente fragmento HTML:

```html
<div class="foobar" id="first">
    <div class="foobar" id="second">
        barfoo
    </div>
</div>
```

Entonces úselo llamando:

```js
const elem = await browser.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "first"
const nestedElem = await elem.custom$('myCustomStrategy', '.foobar')
console.log(await elem.getAttribute('id')) // returns "second"
```

**Nota:** esto sólo funciona en un entorno web en el que se puede ejecutar el comando [`ejecutar`](/docs/api/browser/execute).
