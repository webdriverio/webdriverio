---
id: record
title: Registro de pruebas
---

Chrome DevTools tiene un panel de _Grabadora_ que permite a los usuarios grabar y reproducir pasos automatizados dentro de Chrome. Estos pasos pueden ser [exportados a pruebas WebdriverIO con una extensión](https://chrome.google.com/webstore/detail/webdriverio-chrome-record/pllimkccefnbmghgcikpjkmmcadeddfn?hl=en&authuser=1) haciendo la prueba de escritura muy fácil.

## ¿Qué es Chrome DevTools Recorder?

La [Chrome DevTools Recorder](https://developer.chrome.com/docs/devtools/recorder/) es una herramienta que le permite grabar y reproducir acciones de prueba directamente en el navegador y también exportarlas como JSON (o exportarlas en e2e test), así como medir el rendimiento de las pruebas.

La herramienta es sencilla, y ya que está conectada al navegador, tenemos la conveniencia de no tener que cambiar el contexto ni de tratar con ninguna herramienta de terceros.

## Cómo grabar una prueba con Chrome DevTools Recorder

Si tiene la última versión de Chrome tendrá la Grabadora ya instalada y disponible para usted. Abra cualquier sitio web, haga clic con el botón derecho del ratón y seleccione _"Inspect"_. Dentro de DevTools puede abrir la Grabadora pulsando `CMD/Control` + `Shift` + `p` e ingresando _"Mostrar Grabador"_.

![Chrome DevTools Recorder](/img/recorder/recorder.png)

Para comenzar a grabar un viaje de usuario, haga clic en _"Iniciar nueva grabación"_, dale un nombre a tu prueba y luego usa el navegador para registrar tu prueba:

![Chrome DevTools Recorder](/img/recorder/demo.gif)

Siguiente paso, haga clic en _"Repetir"_ para comprobar si la grabación fue exitosa y hace lo que quería hacer. Si todo está bien, haga clic en el icono [exportar](https://developer.chrome.com/docs/devtools/recorder/reference/#recorder-extension) y seleccione _"Exportar como WebdriverIO Test Script"_:

La opción _"Exportar como WebdriverIO Test Script"_ sólo está disponible si instala la extensión [WebdriverIO Chrome Recorder](https://chrome.google.com/webstore/detail/webdriverio-chrome-record/pllimkccefnbmghgcikpjkmmcadeddfn).


![Chrome DevTools Recorder](/img/recorder/export.gif)

¡Eso es todo!

## Exportar registro

Si exportó el flujo como script de prueba WebdriverIO, debería descargar el script que puede copiar&pegar en su suite de pruebas. Por ejemplo, la grabación anterior se ve de la siguiente manera:

```ts
describe("My WebdriverIO Test", function () {
  it("tests My WebdriverIO Test", function () {
    await browser.setWindowSize(1026, 688)
    await browser.url("https://webdriver.io/")
    await browser.$("#__docusaurus > div.main-wrapper > header > div").click()
    await browser.$("#__docusaurus > nav > div.navbar__inner > div:nth-child(1) > a:nth-child(3)").click()rec
    await browser.$("#__docusaurus > div.main-wrapper.docs-wrapper.docs-doc-page > div > aside > div > nav > ul > li:nth-child(4) > div > a").click()
    await browser.$("#__docusaurus > div.main-wrapper.docs-wrapper.docs-doc-page > div > aside > div > nav > ul > li:nth-child(4) > ul > li:nth-child(2) > a").click()
    await browser.$("#__docusaurus > nav > div.navbar__inner > div.navbar__items.navbar__items--right > div.searchBox_qEbK > button > span.DocSearch-Button-Container > span").click()
    await browser.$("#docsearch-input").setValue("click")
    await browser.$("#docsearch-item-0 > a > div > div.DocSearch-Hit-content-wrapper > span").click()
  });
});
```

resistente si es necesario. También puede exportar el flujo como archivo JSON y usar el paquete [`@wdio/chrome-recorder`](https://github.com/webdriverio/chrome-recorder) para convertirlo en un script de prueba real.

## Siguientes Pasos

Puede utilizar este flujo para crear fácilmente pruebas para sus aplicaciones. Chrome DevTools Recorder tiene varias características adicionales, por ejemplo.:

- [Simular red lenta](https://developer.chrome.com/docs/devtools/recorder/#simulate-slow-network) o
- [Mida el rendimiento de sus pruebas](https://developer.chrome.com/docs/devtools/recorder/#measure)

Asegúrese de revisar sus [documentos](https://developer.chrome.com/docs/devtools/recorder).
