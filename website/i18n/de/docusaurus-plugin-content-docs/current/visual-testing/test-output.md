---
id: test-output
title: Testausgabe
---

:::info

Für die Beispielbildausgabe wurde [diese WebdriverIO](https://guinea-pig.webdriver.io/image-compare.html) Demo-Seite verwendet.

:::

## `enableLayoutTesting`

Dies kann sowohl in den [Service-Optionen](./service-options#enablelayouttesting) als auch auf der [Methoden](./method-options)-Ebene eingestellt werden.

```js
// wdio.conf.(js|ts)
export const config = {
    // ...
    // =====
    // Setup
    // =====
    services: [
        [
            'visual',
            {
                enableLayoutTesting: true
            }
        ]
    ]
    // ...
}
```

Die Bildausgabe für die [Service-Optionen](./service-options#enablelayouttesting) ist identisch mit der [Methoden](./method-options)-Ebene, siehe unten.

### Bildausgabe

<Tabs
defaultValue="saveelement"
values={[
{label: 'saveElement | checkElement', value: 'saveelement'},
{label: 'saveScreen | checkScreen', value: 'savescreen'},
{label: 'saveFullPageScreen | checkFullPageScreen', value: 'savefullpagescreen'},
{label: 'saveTabbablePage | checkTabbablePage', value: 'saveTabbablePage'},
]}

>

<TabItem value="saveelement">

```js
await browser.saveElement(".features_vqN4", "example-element-tag", {enableLayoutTesting: true})
// Oder
await browser.checkElement(".features_vqN4", "example-element-tag", {enableLayoutTesting: true})
```

![saveElement Desktop](/img/visual/layout-element-local-chrome-latest-1366x768.png)

</TabItem>

<TabItem value="savescreen">

```js
await browser.saveScreen("example-page-tag")
```

![saveScreen Desktop](/img/visual/layout-viewportScreenshot-chrome-latest-1366x768.png)

</TabItem>

<TabItem value="savefullpagescreen">

```js
await browser.saveFullPageScreen("full-page-tag")
// Oder
await browser.checkFullPageScreen("full-page-tag", {enableLayoutTesting: true})
```

![saveFullPageScreens Desktop](/img/visual/layout-fullPage-chrome-latest-1366x768.png)

</TabItem>

<TabItem value="saveTabbablePage">

```js
await browser.saveTabbablePage("tabbable-page-tag")
// Oder
await browser.checkTabbablePage("tabbable-page-tag", {enableLayoutTesting: true})
```

![saveFullPageScreens Desktop](/img/visual/layout-tabbable-chrome-latest-1366x768.png)

</TabItem>
</Tabs>

## save(Screen/Element/FullPageScreen)

### Konsolenausgabe

Die `save(Screen/Element/FullPageScreen)`-Methoden liefern die folgenden Informationen, nachdem die Methode ausgeführt wurde:

```js
const saveResult = await browser.saveFullPageScreen({ ... })
console.log(saveResults)
/**
 * {
 *   // Das Gerätepixelverhältnis der ausgeführten Instanz
 *   devicePixelRatio: 1,
 *   // Der formatierte Dateiname, abhängig von der Option `formatImageName`
 *   fileName: "examplePage-chrome-latest-1366x768.png",
 *   // Der Pfad, unter dem die tatsächliche Screenshot-Datei zu finden ist
 *   path: "/path/to/project/.tmp/actual/desktop_chrome",
 * };
 */
```

### Bildausgabe

<Tabs
defaultValue="saveelement"
values={[
{label: 'saveElement', value: 'saveelement'},
{label: 'saveScreen', value: 'savescreen'},
{label: 'saveFullPageScreen', value: 'savefullpagescreen'},
]}

>

<TabItem value="saveelement">

```js
await browser.saveElement(".hero__title-logo", "example-element-tag")
```

<Tabs
defaultValue="desktop"
values={[
{label: 'Desktop', value: 'desktop'},
{label: 'Android', value: 'android'},
{label: 'iOS', value: 'ios'},
]}

>

<TabItem value="desktop">
![saveElement Desktop](/img/visual/wdioLogo-chrome-latest-1-1366x768.png)
</TabItem>
<TabItem value="android">
![saveElement Mobile Android](/img/visual/wdioLogo-EmulatorAndroidGoogleAPIPortraitNativeWebScreenshot14.0-384x640.png)
</TabItem>
<TabItem value="ios">
![saveElement Mobile iOS](/img/visual/wdioLogo-Iphone12Portrait16-390x844.png)
</TabItem>
</Tabs>
</TabItem>

<TabItem value="savescreen">

```js
await browser.saveScreen("example-page-tag")
```

<Tabs
defaultValue="desktop"
values={[
{label: 'Desktop', value: 'desktop'},
{label: 'Android ChromeDriver', value: 'android-chromedriver'},
{label: 'Android nativeWebScreenshot', value: 'android-native'},
{label: 'iOS', value: 'ios'},
]}

>

<TabItem value="desktop">
![saveScreen Desktop](/img/visual/examplePage-chrome-latest-1366x768.png)
</TabItem>
<TabItem value="android-chromedriver">
![saveScreen Mobile Android ChromeDriver](/img/visual/screenshot-EmulatorAndroidGoogleAPIPortraitChromeDriver14.0-384x640.png)
</TabItem>
<TabItem value="android-native">
![saveScreen Mobile Android nativeWebScreenshot](/img/visual/screenshot-EmulatorAndroidGoogleAPIPortraitNativeWebScreenshot14.0-384x640.png)
</TabItem>
<TabItem value="ios">

:::info TIPP
iOS `saveScreen`-Ausführungen enthalten standardmäßig nicht die Geräterahmenecken. Um diese zu erhalten, fügen Sie bitte die Option `addIOSBezelCorners:true` beim Instanziieren des Services hinzu, siehe [hier](./service-options#addiosbezelcorners)
:::

![saveScreen Mobile iOS](/img/visual/screenshot-Iphone12Portrait15-390x844.png)
</TabItem>
</Tabs>
</TabItem>

<TabItem value="savefullpagescreen">

```js
await browser.saveFullPageScreen("full-page-tag")
```

<Tabs
defaultValue="desktop"
values={[
{label: 'Desktop', value: 'desktop'},
{label: 'Android', value: 'android'},
{label: 'iOS', value: 'ios'},
]}

>

<TabItem value="desktop">
![saveFullPageScreens Desktop](/img/visual/fullPage-chrome-latest-1366x768.png)
</TabItem>
<TabItem value="android">
![saveFullPageScreens Mobile Android](/img/visual/fullPage-EmulatorAndroidGoogleAPIPortraitChromeDriver14.0-384x640.png)
</TabItem>
<TabItem value="ios">
![saveFullPageScreens Mobile iOS](/img/visual/fullPage-Iphone12Portrait16-390x844.png)
</TabItem>
</Tabs>
</TabItem>
</Tabs>

## check(Screen/Element/FullPageScreen)

### Konsolenausgabe

Standardmäßig liefern die `check(Screen/Element/FullPageScreen)`-Methoden nur einen Abweichungsprozentsatz wie `1.23`, aber wenn das Plugin die Option `returnAllCompareData: true` hat, werden folgende Informationen nach der Ausführung der Methode bereitgestellt:

```js
const checkResult = await browser.checkFullPageScreen({ ... })
console.log(checkResult)
/**
 * {
 *     // Der formatierte Dateiname, abhängig von der Option `formatImageName`
 *     fileName: "examplePage-chrome-headless-latest-1366x768.png",
 *     folders: {
 *         // Der Ordner für die tatsächlichen Bilder und der Dateiname
 *         actual: "/path/to/project/.tmp/actual/desktop_chrome/examplePage-chrome-headless-latest-1366x768.png",
 *         // Der Baseline-Ordner und der Dateiname
 *         baseline:
 *             "/path/to/project/localBaseline/desktop_chrome/examplePage-chrome-headless-latest-1366x768.png",
 *         // Dieser folgende Ordner ist optional und nur vorhanden, wenn es eine Abweichung gibt
 *         // Der Ordner, der die Unterschiede und den Dateinamen enthält
 *         diff: "/path/to/project/.tmp/diff/desktop_chrome/examplePage-chrome-headless-latest-1366x768.png",
 *     },
 *     // Der Abweichungsprozentsatz
 *     misMatchPercentage: 2.34,
 * };
 */
```

### Bildausgabe

:::info
Die folgenden Bilder zeigen nur Unterschiede als Ergebnis der Ausführung der Check-Befehle. Es wird nur die Differenz in einem Browser angezeigt, aber die Ausgabe für Android und iOS ist die gleiche.
:::

<Tabs
defaultValue="checkelement"
values={[
{label: 'checkElement', value: 'checkelement'},
{label: 'checkScreen', value: 'checkscreen'},
{label: 'checkFullPageScreen', value: 'checkfullpagescreen'},
]}

>

<TabItem value="checkelement">

```js
await browser.checkElement("#__docusaurus_skipToContent_fallback > header > div > div.buttons_pzbO > a:nth-child(1)", "example-element-tag")
```

:::info
Der Button-Text wurde von `Get Started` zu `Getting Started!` geändert und als Änderung erkannt.
:::

![Button Check Result](/img/visual/button-check.png)

</TabItem>

<TabItem value="checkscreen">

```js
await browser.checkScreen("example-page-tag")
```

:::info
Der Button-Text wurde von `Get Started` zu `Getting Started!` geändert und als Änderung erkannt.
:::

![Button Check Result](/img/visual/screen-check.png)

</TabItem>

<TabItem value="checkfullpagescreen">

```js
await browser.checkFullPageScreen("full-page-tag")
```

:::info
Der Button-Text wurde von `Get Started` zu `Getting Started!` geändert und als Änderung erkannt.
:::

![Button Check Result](/img/visual/fullpage-check.png)

</TabItem>

</Tabs>

## Ausblendungen

Hier finden Sie ein Beispiel für Ausblendungen in Android NativeWebScreenshot und iOS, bei denen der Status+Adressbereich und die Symbolleiste ausgeblendet sind.

<Tabs
defaultValue="nativeWebScreenshot"
values={[
{label: 'Android nativeWebScreenshot', value: 'nativeWebScreenshot'},
{label: 'iOS', value: 'ios'},
]}

>

<TabItem value="nativeWebScreenshot">

![Blockouts Android](/img/visual/android.blockouts.png)

</TabItem>

<TabItem value="ios">

![Blockouts iOS](/img/visual/ios.blockouts.png)

</TabItem>

</Tabs>
