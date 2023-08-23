---
id: capabilities
title: Capacidades
---

Una capacidad es la definición de una interfaz remota. Ayuda a WebdriverIO a comprender en qué navegador o entorno móvil le gusta ejecutar sus pruebas. Las capacidades son menos cruciales a la hora de desarrollar pruebas localmente a medida que se ejecuta en una interfaz remota la mayoría de las veces, pero se hace más importante cuando se ejecuta un amplio conjunto de pruebas de integración en CI/Cd.

:::info

El formato de un objeto de capacidad está bien definido por la [especificación WebDriver](https://w3c.github.io/webdriver/#capabilities). El testrunner de WebdriverIO fallará temprano si las capacidades definidas por el usuario no se adhieren a esa especificación.

:::

## Características personalizadas

Mientras que la cantidad de capacidades definidas fijas es baja todo el mundo puede proporcionar y aceptar funciones personalizadas que son específicas del controlador de automatización o interfaz remota:

### Extensiones de Capacidad Específica del Explorador

- `goog:chromeOptions`: [extensiones de Chromedriver](https://chromedriver.chromium.org/capabilities) , solo aplicables para pruebas en Chrome
- `moz:firefoxOptions`: [extensiones](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html) de Geckodriver solo aplicables para pruebas en Firefox
- `ms:edgeOptions`: [EdgeOptions](https://learn.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options) para especificar el entorno cuando se usa EdgeDriver para probar Chromium Edge

### Extensiones de capacidad del vendedor en la nube

- `sauce:options`: [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#w3c-webdriver-browser-capabilities--optional)
- `bstack:options`: [BrowserStack](https://www.browserstack.com/docs/automate/selenium/organize-tests)
- `tb:options`: [TestingBot](https://testingbot.com/support/other/test-options)
- y mucho más...

### Extensiones de capacidad de Motor de Automatización

- `appium:xxx`: [Appium](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- y mucho más...

### WebdriverIO Capabilities to manage browser driver options

WebdriverIO manages installing and running browser driver for you. In order to propagate options to the driver you can use the following custom capabilities:

- `wdio:chromedriverOptions`: manage Chromedriver options (see `chromedriver --help` for more information)
- `wdio:safaridriverOptions`: manage Safaridriver [options](https://github.com/webdriverio-community/node-safaridriver#options)
- `wdio:geckodriverOptions`: manage Geckodriver [options](https://github.com/webdriverio-community/node-geckodriver#options)
- `wdio:edgedriverOptions`: manage Edgedriver [options](https://github.com/webdriverio-community/node-edgedriver#options)

## Capacidades especiales para Casos de Uso Específico

Esta es una lista de ejemplos que muestran qué capacidades se deben aplicar para lograr un caso de uso concreto.

### Ejecutar navegador remotamente

Ejecutar un navegador remotamente significa ejecutar una instancia del navegador sin ventana o IU. Esto se usa principalmente en entornos CI/CD en los que no se usa ninguna pantalla. Para ejecutar un navegador en modo remoto, aplique las siguientes capacidades:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
 {label: 'Firefox', value: 'firefox'},
 {label: 'Microsoft Edge', value: 'msedge'},
 {label: 'Safari', value: 'safari'},
 ]
}>
<TabItem value="chrome">

```ts
{
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: ['headless', 'disable-gpu']
    }
}
```

</TabItem>
<TabItem value="firefox">

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        args: ['-headless']
    }
```

</TabItem>
<TabItem value="msedge">

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        args: ['--headless']
    }
```

</TabItem>
<TabItem value="safari">

It seems that Safari [doesn't support](https://discussions.apple.com/thread/251837694) running in headless mode.

</TabItem>
</Tabs>

### Automate Different Browser Channels

If you like to test a browser version that is not yet released as stable, e.g. Chrome Canary, you can do so by setting capabilities and pointing to the browser you like to start, e.g.:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
 {label: 'Firefox', value: 'firefox'},
 {label: 'Microsoft Edge', value: 'msedge'},
 {label: 'Safari', value: 'safari'},
 ]
}>
<TabItem value="chrome">

When testing on Chrome, WebdriverIO will automatically download the desired browser version and driver for you based on the defined `browserVersion`, e.g.:

```ts
{
    browserName: 'chrome',
    browserVersion: '116' // or '116.0.5845.96', 'stable', 'dev', 'canary', 'beta'
}
```

</TabItem>
<TabItem value="firefox">

When testing on Firefox, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        bin: '/Applications/Firefox\ Nightly.app/Contents/MacOS/firefox'
    }
```

</TabItem>
<TabItem value="msedge">

When testing on Micrsoft Edge, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        bin: '/Applications/Microsoft\ Edge\ Canary.app/Contents/MacOS/Microsoft\ Edge\ Canary'
    }
```

</TabItem>
<TabItem value="safari">

When testing on Safari, make sure you have the [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/) installed on your machine. You can point WebdriverIO to that version via:

```ts
    browserName: 'safari technology preview'
```

</TabItem>
</Tabs>
