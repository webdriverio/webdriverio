---
id: automationProtocols
title: Protocoles de automatización
---

Con WebdriverIO, puede elegir entre múltiples tecnologías de automatización cuando ejecute sus pruebas E2E localmente o en la nube. De forma predeterminada, WebdriverIO siempre comprobará si hay un controlador de navegador que cumpla con el protocolo WebDriver en `localhost:4444`. Si no puede encontrar este controlador se vuelve a usar Chrome DevTools usando Puppeteer bajo la capa.

Casi todos los navegadores modernos que soportan [WebDriver](https://w3c.github.io/webdriver/) también soportan otra interfaz nativa llamada [DevTools](https://chromedevtools.github.io/devtools-protocol/) que puede ser usada para automatizar finalidades.

Ambas tienen ventajas y desventajas, dependiendo de su caso de uso y entorno.

## Protocolo WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) es una interfaz de control remoto que permite la introspección y el control de agentes de usuarios. Proporciona un protocolo de cable neutral en la plataforma y en el lenguaje como una forma para que los programas fuera de proceso puedan dar instrucciones remotamente al comportamiento de los navegadores web.

El protocolo WebDriver ha sido diseñado para automatizar un navegador desde la perspectiva del usuario, significa que todo lo que un usuario es capaz de hacer, puede hacer con el explorador. Proporciona un conjunto de comandos que abstraen interacciones comunes con una aplicación (por ejemplo, navegando, haciendo clic o leyendo el estado de un elemento). Dado que es un estándar web, está bien soportado en todos los principales proveedores de navegador, y también está siendo utilizado como protocolo subyacente para la automatización móvil usando [Appium](http://appium.io).

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
