---
id: pageobjects
title: Patrón de objetos de página
---

La versión 5 de WebdriverIO fue diseñada teniendo en cuenta el soporte del Patrón de objetos de página. Al introducir el principio de "los elementos como ciudadanos de primera clase", ahora es posible construir grandes suites de pruebas utilizando este patrón.

No se requiere ningún paquete adicional para crear objetos de página. Resulta que las clases limpias y modernas proporcionan todas las características necesarias que necesitamos:

- herencia entre objetos de página
- carga de elementos lenta
- encapsulación de métodos y acciones

El objetivo de utilizar objetos de página es abstractar cualquier información de página lejos de las pruebas reales. Idealmente, debe almacenar todos los selectores o instrucciones específicas que sean únicas para una determinada página en un objeto de página, para que pueda ejecutar su prueba después de que haya rediseñado completamente su página.

## Crear un objeto de página

Primero, necesitamos un objeto de página principal que llamamos `Page.js`. Contendrá selectores generales o métodos de los que heredarán todos los objetos de página.

```js
// Page.js
export default class Page {
    constructor() {
        this.title = 'My Page'
    }

    async open (path) {
        await browser.url(path)
    }
}
```

Siempre exportaremos `` una instancia de un objeto de página, y nunca crearemos esa instancia en la prueba. Como estamos escribiendo pruebas de punto a punto, siempre consideramos la página como una construcción sin estado&mdash;así como cada petición HTTP es una construcción sin estado.

Claro que el navegador puede llevar información de sesión y por lo tanto puede mostrar diferentes páginas basadas en diferentes sesiones, pero esto no debe reflejarse dentro de un objeto de página. Este tipo de cambios de estado deberían estar en tus pruebas reales.

Vamos a comenzar probando la primera página. Para propósitos de la demostración, utilizaremos [El sitio web de Internet](http://the-internet.herokuapp.com) de [Elemental Selenium](http://elementalselenium.com) como guiso. Intentemos crear un ejemplo de objeto de página para la [página de inicio de sesión](http://the-internet.herokuapp.com/login).

## `Obtén` -tus selectores

El primer paso es escribir todos los selectores importantes que son requeridos en nuestro objeto `login.page` como funciones getter:

```js
// login.page.js
import Page from './page'

class LoginPage extends Page {

    get username () { return $('#username') }
    get password () { return $('#password') }
    get submitBtn () { return $('form button[type="submit"]') }
    get flash () { return $('#flash') }
    get headerLinks () { return $$('#header a') }

    async open () {
        await super.open('login')
    }

    async submit () {
        await this.submitBtn.click()
    }

}

export default new LoginPage()
```

Definir selectores en las funciones getter puede parecer un poco extraño, pero es realmente útil. Estas funciones son evaluadas _cuando accede a la propiedad_, no cuando genera el objeto. Con esto usted siempre pide el elemento antes de realizar una acción.

## Comandos de cadena

WebdriverIO recuerda internamente el último resultado de un comando. Si encadena un comando de elemento con un comando de acción, encuentra el elemento del comando anterior y utiliza el resultado para ejecutar la acción. Con esto se puede eliminar el selector (primer parámetro) y el comando se ve tan simple como:

```js
await LoginPage.username.setValue('Max Mustermann')
```

Lo cual es básicamente lo mismo como:

```js
let elem = await $('#username')
await elem.setValue('Max Mustermann')
```

o

```js
await $('#username').setValue('Max Mustermann')
```

## Utilizar objetos de página en tus pruebas

Después de haber definido los elementos y métodos necesarios para la página, puede comenzar a escribir la prueba para ella. Todo lo que necesitas hacer para usar el objeto de página es `importar` (o `requerir`). ¡Eso es todo!

Desde que exportó una instancia ya creada del objeto de página, importarla le permite empezar a usarla de inmediato.

Si usas un framework de afirmación, tus pruebas pueden ser aún más expresivas:

```js
// login.spec.js
import LoginPage from '../pageobjects/login.page'

describe('login form', () => {
    it('should deny access with wrong creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('foo')
        await LoginPage.password.setValue('bar')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('Your username is invalid!')
    })

    it('should allow access with correct creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('tomsmith')
        await LoginPage.password.setValue('SuperSecretPassword!')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('You logged into a secure area!')
    })
})
```

Desde el lado estructural, tiene sentido separar los archivos de especificaciones y los objetos de página en diferentes directorios. Además, puede dar a cada objeto de página el finalizado: `.page.js`. Esto deja más claro que se importa un objeto de página.

## Más adelante

Este es el principio básico de cómo escribir objetos de páginas con WebdriverIO. ¡Pero puedes construir estructuras de objetos de página más complejas que esto! Por ejemplo, puede tener objetos específicos de página para modales, o dividir un gran objeto de página en diferentes clases (cada una representa una parte diferente de la página web) que heredan del objeto de la página principal. El patrón proporciona muchas oportunidades para separar la información de la página de sus pruebas, que es importante para mantener su suite de pruebas estructurada y clara en momentos en los que el proyecto y el número de pruebas crecen.

Puedes encontrar este ejemplo (e incluso más ejemplos de objetos de página) en la carpeta [`ejemplo`](https://github.com/webdriverio/webdriverio/tree/main/examples/pageobject) en GitHub.
