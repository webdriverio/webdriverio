---
id: protocols
title: Comandos de protocolo
---

WebdriverIO es un marco de automatización que se basa en varios de los protocolos de automatización para controlar un agente remoto, por ejemplo, para un navegador, un dispositivo móvil o un televisor. En función del dispositivo remoto entran en juego distintos protocolos. Estos comandos se asignan al objeto [Navegador](/docs/api/browser) o [Elemento](/docs/api/elemento) en función de la información de la sesión por parte del servidor remoto (por ejemplo, el controlador del navegador).

Internamente WebdriverIO utiliza comandos de protocolo para casi todas las interacciones con el agente remoto. Sin embargo los comandos adicionales asignados al Objeto [Browser](/docs/api/browser) o [Element](/docs/api/element) simplifican el uso de WebdriverIO, por ejemplo, obtener el texto de un elemento utilizando comandos de protocolo tendría el siguiente aspecto:

```js
const searchInput = await browser.findElement('css selector', '#lst-ib')
await client.getElementText(searchInput['elemento-6066-11e4-a52e-4f735466cecf'])
```

Utilizando los cómodos comandos del objeto [Browser](/docs/api/browser) o [Element](/docs/api/element) esto puede reducirse a

```js
$('#lst-ib').getText()
```

La siguiente sección explica cada protocolo individual.

## Protocolo WebDriver

El protocolo [WebDriver](https://w3c.github.io/webdriver/#elements) es un estándar web para la automatización del navegador. A diferencia de otras herramientas E2E, garantiza que la automatización puede realizarse en los navegadores reales que utilizan sus usuarios, por ejemplo, Firefox, Safari y Chrome, y en navegadores basados en Chromium como Edge, y no sólo en motores de navegación, por ejemplo, WebKit, que son muy diferentes.

La ventaja de utilizar el protocolo WebDriver frente a protocolos de depuración como [Chrome DevTools](https://w3c.github.io/webdriver/#elements) es que dispone de un conjunto específico de comandos que permiten interactuar con el navegador de la misma forma en todos los navegadores, lo que reduce la probabilidad de que se produzcan fallos. Además ofrece este protocolo capacidades para la escalabilidad masiva mediante el uso de proveedores de nube como [Sauce Labs](https://saucelabs.com/), [BrowserStack](https://www.browserstack.com/) y [otros](https://github.com/christian-bromann/awesome-selenium#cloud-services).

## Protocolo WebDriver Bidi

El protocolo [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) es la segunda generación del protocolo y en él trabajan actualmente la mayoría de los proveedores de navegadores. En comparación con su predecesor, el protocolo admite una comunicación bidireccional (de ahí lo de "Bidi") entre el marco y el dispositivo remoto. Además, introduce primitivas adicionales para una mejor introspección del navegador, con el fin de automatizar mejor las aplicaciones web modernas en el navegador.

Dado que este protocolo es actualmente un trabajo en curso se añadirán más características con el tiempo y serán soportadas por el navegador. Si utiliza los cómodos comandos de WebdriverIO nada cambiará para usted. WebdriverIO hará uso de estas nuevas capacidades del protocolo tan pronto como estén disponibles y soportadas en el navegador.

## Appium

El proyecto [Appium](https://appium.io/) proporciona capacidades para automatizar dispositivos móviles, de escritorio y todo tipo de dispositivos IoT. Mientras que WebDriver se centra en el navegador y la web, la visión de Appium es utilizar el mismo enfoque pero para cualquier dispositivo arbitrario. Además de los comandos que WebDriver define, dispone de comandos especiales que a menudo son específicos del dispositivo remoto que se está automatizando. Para escenarios de pruebas móviles, esto es ideal cuando se desea escribir y ejecutar las mismas pruebas para aplicaciones Android e iOS.

Según Appium [documentación](https://appium.io/docs/en/about-appium/intro/?lang=en) fue diseñado para satisfacer las necesidades de automatización móvil de acuerdo con una filosofía esbozada por los cuatro principios siguientes:

- No debería tener que recompilar su aplicación ni modificarla en modo alguno para automatizarla.
- No debería estar encerrado en un lenguaje o marco específico para escribir y ejecutar sus pruebas.
- Un marco de automatización móvil no debería reinventar la rueda en lo que respecta a las API de automatización.
- Un marco de automatización móvil debería ser de código abierto, ¡tanto en espíritu y práctica como en nombre!

## Chromium

El protocolo Chromium ofrece un superconjunto de comandos sobre el protocolo WebDriver que sólo es compatible cuando se ejecuta la sesión automatizada a través de [Chromedriver](https://chromedriver.chromium.org/chromedriver-canary).

## Firefox

El protocolo Firefox ofrece un superconjunto de comandos sobre el protocolo WebDriver que sólo es compatible cuando se ejecuta la sesión automatizada a través de [Geckodriver](https://github.com/mozilla/geckodriver).

## Sauce Labs

El protocolo [Sauce Labs](https://saucelabs.com/) ofrece un superconjunto de comandos sobre el protocolo WebDriver que sólo es compatible cuando se ejecuta la sesión automatizada a través de la nube de Sauce Labs.

## Selenium Standalone

El protocolo [Selenium Standalone](https://www.selenium.dev/documentation/grid/advanced_features/endpoints/) ofrece un superconjunto de comandos sobre el protocolo WebDriver que sólo es compatible cuando se ejecuta la sesión automatizada utilizando la Red de Selenium.

## Protocolo JSON Wire

El [JSON Wire Protocol](https://www.selenium.dev/documentation/legacy/json_wire_protocol/) es el pre-predecesor del protocolo WebDriver y __deprecated__ hoy en día. Aunque algunos comandos podrían seguir siendo compatibles en determinados entornos, no se recomienda utilizar ninguno de sus comandos.

## Protocolo JSON Wire para móviles

El [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md) es un superconjunto de comandos móviles sobre el JSON Wire Protocol. Dado que este está obsoleto el Mobile JSON Wire Protocol también quedó __deprecated__. Es posible que Appium aún soporte algunos de sus comandos, pero no se recomienda utilizarlos.
