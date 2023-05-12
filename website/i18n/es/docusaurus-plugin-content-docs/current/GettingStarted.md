---
id: gettingstarted
title: Primeros pasos
---

Bienvenido a la página de documentación para WebdriverIO. Te ayudará a comenzar rápidamente. Si encuentras problemas puedes encontrar ayuda y respuestas en nuestro [Servidor de soporte de Discord](https://discord.webdriver.io) o puedes pulsarme en [Twitter](https://twitter.com/webdriverio).

:::info
Estos son los documentos de la última versión (__>=8.x__) de WebdriverIO. Si todavía está utilizando una versión anterior, por favor visite los [antiguos sitios web de documentación](/versions)!
:::
:::

<LiteYouTubeEmbed id="rA4IFNyW54c" title="Getting Started with WebdriverIO" />

:::tip کانال رسمی یوتیوب 🎥

Puede encontrar más videos sobre WebdriverIO en el [canal oficial de YouTube](https://youtube.com/@webdriverio). ¡Asegúrate de suscribirte!

:::

## Iniciar una configuración de WebdriverIO

Para añadir una configuración completa de WebdriverIO a un proyecto existente o nuevo usando el [WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio), ejecute:

Si se encuentra en el directorio raíz de un proyecto existente, ejecute:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```

o si desea crear un nuevo proyecto:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```

o si desea crear un nuevo proyecto:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```sh
pnpm create wdio .

</TabItem>
</Tabs>

Este único comando descarga la herramienta CLI WebdriverIO y ejecuta un asistente de configuración que le ayuda a configurar su suite de pruebas.

<CreateProjectAnimation />

El asistente le preguntará a una serie de preguntas que le guiarán a través de la configuración. Puedes pasar un parámetro `--yes` para elegir una configuración predeterminada que usará Mocha con Chrome usando el patrón \[Page Object\](https://martinfowler.com/bliki/PageObject.html).

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## Ejecutar Prueba

Puede iniciar su suite de pruebas usando el comando `run` y apuntando a la configuración WebdriverIO que acaba de crear:

```sh
npx wdio run ./wdio.conf.js
```

Si quieres ejecutar archivos de prueba específicos puedes añadir un parámetro `--spec`:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

o definir suites en su archivo de configuración y ejecutar sólo los archivos de prueba definidos por una suite:

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## Ejecutar en un script

Si desea utilizar WebdriverIO como un motor de automatización en [Modo independiente](/docs/setuptypes#standalone-mode) dentro de un Nodo. Script S también puede instalar directamente WebdriverIO y usarlo como un paquete, por ejemplo, para generar una captura de pantalla de un sitio web:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__Nota:__ todos los comandos WebdriverIO son asíncronos y necesitan ser manejados correctamente usando [`async/await`](https://javascript.info/async-await).

## Registrar pruebas

WebdriverIO proporciona herramientas para ayudarle a comenzar grabando sus acciones de prueba en pantalla y generar scripts de prueba WebdriverIO automáticamente. Ver [Grabadoras con Chrome DevTools Recorder](/docs/record) para más información.

## Requerimientos del sistema

Necesitará [Node.js](http://nodejs.org) instalado.

- Instalar al menos v16.x o superior, ya que esta es la versión LTS más antigua
- Solo los lanzamientos que se conviertan o se convertirán en una versión de LTS están oficialmente soportados

Si el nodo no está instalado en su sistema, sugerimos utilizar una herramienta como [NVM](https://github.com/creationix/nvm) o [Volta](https://volta.sh/) para ayudar a gestionar múltiples nodos activos. s versiones. NVM es una elección popular, mientras que Volta es también una buena alternativa.
