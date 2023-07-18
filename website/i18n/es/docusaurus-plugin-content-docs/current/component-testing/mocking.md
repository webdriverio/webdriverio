---
id: mocking
title: Mocking
---

Cuando escriba pruebas es sólo cuestión de tiempo antes de que necesite crear una versión "falsa" de un servicio interno — o externo. Esto se conoce comúnmente como simulación. WebdriverIO proporciona funciones de utilidad para ayudarle. Puedes `importar { fn, spyOn, mock, unmock } de '@wdio/browser-runner'` para acceder a él. Vea más información sobre las utilidades de simulación disponibles en los [documentos API](/docs/api/modules#wdiobrowser-runner).

## Funciones

Para validar si cierto manejador de funciones es llamado como parte de las pruebas de sus componentes, el módulo `@wdio/browser-runner` exporta primitivos simuladores que puedes usar para probar, si estas funciones han sido llamadas. Puede importar estos métodos vía:

```js
import { fn, spy } from '@wdio/browser-runner'
```

Al importar `fn` puede crear una función espía (simulación) para rastrear su ejecución y con `spyOn` seguir un método sobre un objeto ya creado.

<Tabs
  defaultValue="mocks"
  values={[
    {label: 'Mocks', value: 'mocks'},
 {label: 'Spies', value: 'spies'}
 ]
}>
<TabItem value="mocks">

El ejemplo completo se encuentra en el repositorio [Component Testing Example](https://github.com/webdriverio/component-testing-examples/blob/main/react-typescript-vite/src/tests/LoginForm.test.tsx).

```ts
import React from 'react'
import { $, expect } from '@wdio/globals'
import { fn } from '@wdio/browser-runner'
import { Key } from 'webdriverio'
import { render } from '@testing-library/react'

import LoginForm from '../components/LoginForm'

describe('LoginForm', () => {
    it('should call onLogin handler if username and password was provided', async () => {
        const onLogin = fn()
        render(<LoginForm onLogin={onLogin} />)
        await $('input[name="username"]').setValue('testuser123')
        await $('input[name="password"]').setValue('s3cret')
        await browser.keys(Key.Enter)

        /**
         * verify the handler was called
         */
        expect(onLogin).toBeCalledTimes(1)
        expect(onLogin).toBeCalledWith(expect.equal({
            username: 'testuser123',
            password: 's3cret'
        }))
    })
})
```

</TabItem>
<TabItem value="spies">

El ejemplo completo se puede encontrar en el directorio [examples](https://github.com/webdriverio/webdriverio/blob/main/examples/wdio/browser-runner/lit.test.js).

```js
import { expect, $ } from '@wdio/globals'
import { spyOn } from '@wdio/browser-runner'
import { html, render } from 'lit'
import { SimpleGreeting } from './components/LitComponent.ts'

const getQuestionFn = spyOn(SimpleGreeting.prototype, 'getQuestion')

describe('Lit Component testing', () => {
    it('should render component', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello, WebdriverIO! How are you today?')
    })

    it('should render with mocked component function', async () => {
        getQuestionFn.mockReturnValue('Does this work?')
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello, WebdriverIO! Does this work?')
    })
})
```

</TabItem>
</Tabs>

WebdriverIO solo reexporta [`@vitest/spy`](https://www.npmjs.com/package/@vitest/spy) aquí que es una implementación de espía compatible con Jest ligera que puede ser usada con WebdriverIOs [`esperan`](/docs/api/expect-webdriverio) matchers. Puede encontrar más documentación sobre estas funciones simuladas en la página del proyecto [Vitest](https://vitest.dev/api/mock.html).

Por supuesto, también puedes instalar e importar cualquier otro entorno espía, por ejemplo [SinonJS](https://sinonjs.org/), siempre y cuando sea compatible con el entorno del navegador.

## Módulos

Simula módulos locales o observa bibliotecas de terceros, que se invocan en algún otro código, permitiendo probar argumentos, salida o incluso redeclarar su implementación.

Hay dos formas de simular funciones: creando una función simulada a usar en el código de prueba, o escribir un mock manual para sobreescribir una dependencia de módulo.

### Simulación de importaciones de archivos

Imaginemos que nuestro componente está importando un método de utilidad desde un archivo para manejar un clic.

```js title=utils.js
export function handleClick () {
    // handler implementation
}
```

En nuestro componente el manejador de clics se utiliza como sigue:

```ts title=LitComponent.js
import { handleClick } from './utils.js'

@customElement('simple-button')
export class SimpleButton extends LitElement {
    render() {
        return html`<button @click="${handleClick}">Click me!</button>`
    }
}
```

Para simular el `handleClick` de `utils.js` podemos usar el método `mock` en nuestra prueba de la siguiente manera:

```js title=LitComponent.test.js
import { expect, $ } from '@wdio/globals'
import { mock, fn } from '@wdio/browser-runner'
import { html, render } from 'lit'

import { SimpleButton } from './LitComponent.ts'
import { handleClick } from './utils.js'

/**
 * mock named export "handleClick" of `utils.ts` file
 */
mock('./utils.ts', () => ({
    handleClick: fn()
}))

describe('Simple Button Component Test', () => {
    it('call click handler', async () => {
        render(html`<simple-button />`, document.body)
        await $('simple-button').$('>>> button').click()
        expect(handleClick).toHaveBeenCalledTimes(1)
    })
})
```

### Dependencias de simulación

Supongamos que tenemos una clase que obtiene usuarios de nuestra API. La clase usa [`axios`](https://github.com/axios/axios) para llamar a la API y luego devuelve el atributo de datos que contiene todos los usuarios:

```js title=users.js
import axios from 'axios';

class Users {
  static all() {
    return axios.get('/users.json').then(resp => resp.data)
  }
}

export default Users
```

Ahora, para probar este método sin tocar la API (y, por lo tanto, crear pruebas lentas y frágiles), podemos usar la función `simulacro (...)` para simular automáticamente el módulo axios.

Una vez que simulamos el módulo, podemos proporcionar un [`mockResolvedValue`](https://vitest.dev/api/mock.html#mockresolvedvalue) para `. y` que retorna los datos que queremos que nuestra prueba verifique en contra. En efecto, estamos diciendo que queremos que `axios.get('/users.json')` devuelva una respuesta falsa.

```js title=users.test.js
import axios from 'axios'; // imports defined mock
import { mock, fn } from '@wdio/browser-runner'

import Users from './users.js'

/**
 * mock default export of `axios` dependency
 */
mock('axios', () => ({
    default: {
        get: fn()
    }
}))

describe('User API', () => {
    it('should fetch users', async () => {
        const users = [{name: 'Bob'}]
        const resp = {data: users}
        axios.get.mockResolvedValue(resp)

        // or you could use the following depending on your use case:
        // axios.get.mockImplementation(() => Promise.resolve(resp))

        const data = await Users.all()
        expect(data).toEqual(users)
    })
})
```

## Parciales

Los subconjuntos de un módulo pueden ser simulados y el resto del módulo puede mantener su implementación real:

```js title=foo-bar-baz.js
export const foo = 'foo';
export const bar = () => 'bar';
export default () => 'baz';
```

The original module will be passed into the mock factory which you can use to e.g. partially mock a dependency:

```js
import { mock, fn } from '@wdio/browser-runner'
import defaultExport, { bar, foo } from './foo-bar-baz.js';

mock('./foo-bar-baz.js', async (originalModule) => {
    // Mock the default export and named export 'foo'
    // and propagate named export from the original module
    return {
        __esModule: true,
        ...originalModule,
        default: fn(() => 'mocked baz'),
        foo: 'mocked foo',
    }
})

describe('partial mock', () => {
    it('should do a partial mock', () => {
        const defaultExportResult = defaultExport();
        expect(defaultExportResult).toBe('mocked baz');
        expect(defaultExport).toHaveBeenCalled();

        expect(foo).toBe('mocked foo');
        expect(bar()).toBe('bar');
    })
})
```

## Mocks manuales

Cuando existe una simulación manual para un módulo determinado, WebdriverIO utilizará ese módulo cuando se llame explícitamente a `mock('nombreModulo')`. Sin embargo, cuando el automock está configurado en 'verdadero', la implementación simulada manual se utilizará en lugar de la simulación creada automáticamente, incluso si `mock('nombremódulo')` no es llamado. To opt out of this behavior you will need to explicitly call `unmock('moduleName')` in tests that should use the actual module implementation, e.g.:

Los módulos con alcance (también conocidos como paquetes con ámbito de aplicación) pueden ser simulados creando un archivo en una estructura de directorios que coincida con el nombre del módulo con el alcance. Por ejemplo, para simular un módulo con ámbito llamado `@scope/project-name`, cree un archivo en `__mocks__/@scope/project-name. s`, creando el directorio `@scope/` en consecuencia.

```
.
├── config
├── __mocks__
│   ├── axios.js
│   ├── lodash.js
│   └── @scope
│       └── project-name.js
├── node_modules
└── views
```

Cuando existe una simulación manual para un módulo determinado, WebdriverIO utilizará ese módulo cuando se llame explícitamente a `mock('nombreModulo')`. Los mocks manuales se definen escribiendo un módulo en un subdirectorio de `__mocks__/` (ver también la opción `automockDir`). Si el módulo que está simulando es un módulo Node (p.ej. `lodash`), la simulación debe colocarse en el directorio `__mocks__` y se simulará automáticamente. No hay necesidad de llamar explícitamente a `mock('module_name')`. Para no participar en este comportamiento, necesitará llamar explícitamente a `unmock('nombremódulo')` en pruebas que deben usar la implementación real del módulo, por ejemplo:

```js
import { unmock } from '@wdio/browser-runner'

unmock('lodash')
```

## Hoisting

Con el fin de hacer que la simulación funcione en el navegador, WebdriverIO reescribe los archivos de prueba y aumenta las llamadas simuladas por encima de todo (ver también [esta entrada de blog](https://www.coolcomputerclub.com/posts/jest-hoist-await/) en el problema de elevación en Jest). Esto limita la forma en que se pueden pasar variables a la resolución de simulaciones, por ejemplo:

```js title=component.test.js
import dep from 'dependency'
const variable = 'foobar'

/**
 * ❌ this fails as `dep` and `variable` are not defined inside the mock resolver
 */
mock('./some/module.ts', () => ({
    exportA: dep,
    exportB: variable
}))
```

Para solucionar esto tienes que definir todas las variables usadas dentro del resolver, por ejemplo:

```js title=component.test.js
/**
 * ✔️ this works as all variables are defined within the resolver
 */
mock('./some/module.ts', async () => {
    const dep = await import('dependency')
    const variable = 'foobar'

    return {
        exportA: dep,
        exportB: variable
    }
})
```

## Solicitudes

Si está buscando solicitudes de mocking del navegador, por ejemplo, llamadas API, diríjase a la sección [Solicitar Mock y Spies](/docs/mocksandspies).
