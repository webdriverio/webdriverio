---
id: typescript
title: Configuración de TypeScript
---

Puede escribir pruebas usando [TypeScript](http://www.typescriptlang.org) para completar automáticamente y escribir seguridad.

Necesitará [`typescript`](https://github.com/microsoft/TypeScript) y [`ts-node`](https://github.com/TypeStrong/ts-node) instalado como `devDependencies`, via:

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

WebdriverIO detectará automáticamente si estas dependencias están instaladas y compilará su configuración y pruebas para usted. Asegúrese de tener un `tsconfig.json` en el mismo directorio que la configuración WDIO. Si necesita configurar cómo se ejecuta ts-node, utilice las variables de entorno para [ts-node](https://www.npmjs.com/package/ts-node#options) o utilice la sección [autoCompileOpts de la configuración de wdio](configurationfile) .

## Configuración

You can provide custom `ts-node` options through the environment (by default it uses the tsconfig.json in the root relative to your wdio config if the file exists):

```sh
# run wdio testrunner with custom options
TS_NODE_PROJECT=./config/tsconfig.e2e.json TS_NODE_TYPE_CHECK=true wdio run wdio.conf.ts
```

La versión mínima de TypeScript es `v4.0.5`.

## Configuración del marco

Y su `tsconfig.json` necesita lo siguiente:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types"]
    }
}
```

Por favor, evite importar `webdriverio` o `@wdio/sync` explícitamente. `WebdriverIO` y `WebDriver` son accesibles desde cualquier lugar una vez añadidos a `tipos` en `tsconfig.json`. Si utiliza servicios adicionales de WebdriverIO, plugins o el paquete de automatización de `devtool`, por favor añádelos también a los `tipos` lista ya que muchos proporcionan tipos adicionales.

## Tipos de Framework

Dependiendo del framework que utilices, necesitarás añadir los tipos para ese framework a tu `tsconfig. son` tipos de propiedad, así como instalar sus definiciones de tipo. Esto es especialmente importante si desea tener soporte de tipo para la biblioteca de aserción integrada [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio).

Por ejemplo, si decide utilizar el framework Mocha, necesitas instalar `@types/mocha` y añadirlo así para tener todos los tipos disponibles globalmente:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'},
 ]
}>
<TabItem value="mocha">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

</TabItem>
<TabItem value="jasmine">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/jasmine-framework"]
    }
}
```

</TabItem>
<TabItem value="cucumber">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/cucumber-framework"]
    }
}
```

</TabItem>
</Tabs>

## Servicios

Si utiliza servicios que añaden comandos al ámbito del navegador, también necesita incluirlos en su `tsconfig.json`. Por ejemplo, si utiliza `@wdio/lighthouse-service` asegúrese de añadirlo a los `tipos` también, por ejemplo.:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "@wdio/lighthouse-service"
        ]
    }
}
```

Añadir servicios y reporteros a su configuración TypeScript también fortalece la seguridad del tipo de su archivo de configuración WebdriverIO.

## Definiciones de tipo

Al ejecutar comandos WebdriverIO todas las propiedades se escriben para que no tenga que tratar de importar tipos adicionales. Sin embargo, hay casos en los que se desea definir variables de antemano. Para asegurarse de que estos son seguros, puede utilizar todos los tipos definidos en el paquete [`@wdio/types`](https://www.npmjs.com/package/@wdio/types). Por ejemplo, si desea definir la opción remota para `webdriverio` puede hacer:

```ts
import type { Options } from '@wdio/types'

const config: Options.WebdriverIO = {
    hostname: 'http://localhost',
    port: '4444' // Error: Type 'string' is not assignable to type 'number'.ts(2322)
    capabilities: {
        browserName: 'chrome'
    }
}
```

## Consejos y sugerencias

### Compilar & Lint

Estar totalmente seguro puede considerar seguir las mejores prácticas: compile su código con el compilador TypeScript (ejecute `tsc` o `npx tsc`) y tenga [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) ejecutándose en [gancho pre-commit](https://github.com/typicode/husky).
