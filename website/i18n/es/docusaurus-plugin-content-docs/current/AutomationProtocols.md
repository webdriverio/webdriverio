---
id: automationProtocols
title: Protocoles de automatización
---

Con WebdriverIO, puede elegir entre múltiples tecnologías de automatización cuando ejecute sus pruebas E2E localmente o en la nube. By default, WebdriverIO will attempt to start a local automation session using the [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol.

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) is an automation protocol to automate browsers using bi-directional communication. It's the successor of the [WebDriver](https://w3c.github.io/webdriver/) protocol and enables a lot more introspection capabilities for various testing use cases.

This protocol is currently under development and new primitives might be added in the future. All browser vendors have committed to implementing this web standard and a lot of [primitives](https://wpt.fyi/results/webdriver/tests/bidi?label=experimental&label=master&aligned) have already been landed in browsers.

## Protocolo WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) es una interfaz de control remoto que permite la introspección y el control de agentes de usuarios. Proporciona un protocolo de cable neutral en la plataforma y en el lenguaje como una forma para que los programas fuera de proceso puedan dar instrucciones remotamente al comportamiento de los navegadores web.

El protocolo WebDriver ha sido diseñado para automatizar un navegador desde la perspectiva del usuario, significa que todo lo que un usuario es capaz de hacer, puede hacer con el explorador. Proporciona un conjunto de comandos que abstraen interacciones comunes con una aplicación (por ejemplo, navegando, haciendo clic o leyendo el estado de un elemento). Since it is a web standard, it is well supported across all major browser vendors and also is being used as an underlying protocol for mobile automation using [Appium](http://appium.io).

Para utilizar este protocolo de automatización, necesita un servidor proxy que traduzca todos los comandos y los ejecuta en el entorno de destino (i. . navegador o aplicación móvil).

Para la automatización del navegador, el servidor proxy suele ser el controlador del navegador. Hay conductores disponibles para todos los navegadores:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Para cualquier tipo de automatización móvil, necesitará instalar y configurar [Appium](http://appium.io). Le permitirá automatizar aplicaciones móviles (iOS/Android) o incluso aplicaciones de escritorio (macOS/Windows) utilizando la misma configuración WebdriverIO.

También hay muchos servicios que le permiten ejecutar la prueba de automatización en la nube a gran escala. En lugar de tener que configurar todos estos controladores a nivel local, puede hablar con estos servicios (e. . [Sauce Labs](https://saucelabs.com)) en la nube e inspecciona los resultados de su plataforma. La comunicación entre el script de prueba y el entorno de la automatización se verá así:

![Configurar WebDriver](/img/webdriver.png)

### Ventajas

- Estándar web oficial del W3C, soportado por los principales navegadores
- Protocolo simple que cubre las interacciones comunes de usuario
- Soporte para la automatización móvil (e incluso aplicaciones de escritorio nativos)
- Se puede usar tanto localmente como en la nube a través de servicios como [Sauce Labs.](https://saucelabs.com)

### Desventaja

- No está diseñado para un análisis profundo del navegador (por ejemplo, rastrear o interceptar eventos de red)
- Conjunto limitado de capacidades de automatización (por ejemplo, sin soporte para acelerar la CPU o la red)
- Intento adicional de configurar el controlador del navegador con selenium-standalone/chromedriver/etc
