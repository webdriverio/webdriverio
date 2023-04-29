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

- `appium:xxx`: [Appium](https://appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- y mucho más...

Eche un vistazo a WebdriverIO [definición de TypeScript de capacidad](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc) para encontrar capacidades específicas para su prueba. Nota: no todos son válidos y es posible que el proveedor no lo admita.

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
 {label: 'Safari Edge', value: 'safari'},
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

Parece que Safari [no admite](https://discussions.apple.com/thread/251837694) trabajar en modo remoto.

</TabItem>
</Tabs>
