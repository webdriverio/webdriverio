---
id: method-options
title: Methoden-Optionen
---

Methoden-Optionen sind Optionen, die pro [Methode](./methods) gesetzt werden können. Wenn die Option den gleichen Schlüssel hat wie eine Option, die während der Instanziierung des Plugins gesetzt wurde, überschreibt diese Methoden-Option den Wert der Plugin-Option.

## Speicher-Optionen

### `disableBlinkingCursor`

- **Typ:** `boolean`
- **Obligatorisch:** Nein
- **Standard:** `false`
- **Unterstützt:** Web, Hybrid App (Webview)

Aktivieren/Deaktivieren des "Blinkens" des Cursors in allen `input`, `textarea`, `[contenteditable]` Elementen in der Anwendung. Wenn auf `true` gesetzt, wird der Cursor vor dem Aufnehmen eines Screenshots auf `transparent` gesetzt
und nach Abschluss zurückgesetzt

### `disableCSSAnimation`

- **Typ:** `boolean`
- **Obligatorisch:** Nein
- **Standard:** `false`
- **Unterstützt:** Web, Hybrid App (Webview)

Aktivieren/Deaktivieren aller CSS-Animationen in der Anwendung. Wenn auf `true` gesetzt, werden alle Animationen vor dem Aufnehmen eines Screenshots deaktiviert
und nach Abschluss zurückgesetzt

### `enableLayoutTesting`

- **Typ:** `boolean`
- **Obligatorisch:** Nein
- **Standard:** `false`
- **Verwendet mit:** Allen [Methoden](./methods)
- **Unterstützt:** Web

Dies blendet den gesamten Text auf einer Seite aus, sodass nur das Layout für den Vergleich verwendet wird. Das Ausblenden erfolgt durch Hinzufügen des Stils `'color': 'transparent !important'` zu **jedem** Element.

Für die Ausgabe siehe [Test-Ausgabe](./test-output#enablelayouttesting)

:::info
Durch die Verwendung dieses Flags erhält jedes Element, das Text enthält (also nicht nur `p, h1, h2, h3, h4, h5, h6, span, a, li`, sondern auch `div|button|..`), diese Eigenschaft. Es gibt **keine** Möglichkeit, dies anzupassen.
:::

### `hideScrollBars`

- **Typ:** `boolean`
- **Obligatorisch:** Nein
- **Standard:** `true`
- **Verwendet mit:** Allen [Methoden](./methods)
- **Unterstützt:** Web, Hybrid App (Webview)

Scrollbalken in der Anwendung ausblenden. Wenn auf true gesetzt, werden alle Scrollbalken vor dem Aufnehmen eines Screenshots deaktiviert. Dies ist standardmäßig auf `true` gesetzt, um zusätzliche Probleme zu vermeiden.

### `hideElements`

- **Typ:** `array`
- **Obligatorisch:** Nein
- **Verwendet mit:** Allen [Methoden](./methods)
- **Unterstützt:** Web, Hybrid App (Webview), Native App

Diese Methode kann ein oder mehrere Elemente ausblenden, indem die Eigenschaft `visibility: hidden` hinzugefügt wird, indem ein Array von Elementen bereitgestellt wird.

### `removeElements`

- **Typ:** `array`
- **Obligatorisch:** Nein
- **Verwendet mit:** Allen [Methoden](./methods)
- **Unterstützt:** Web, Hybrid App (Webview), Native App

Diese Methode kann ein oder mehrere Elemente _entfernen_, indem die Eigenschaft `display: none` hinzugefügt wird, indem ein Array von Elementen bereitgestellt wird.

### `resizeDimensions`

- **Typ:** `object`
- **Obligatorisch:** Nein
- **Standard:** `{ top: 0, right: 0, bottom: 0, left: 0}`
- **Verwendet mit:** Nur für [`saveElement`](./methods#saveelement) oder [`checkElement`](./methods#checkelement)
- **Unterstützt:** Web, Hybrid App (Webview), Native App

Ein Objekt, das `top`, `right`, `bottom` und `left` Pixelwerte enthalten muss, die den Element-Ausschnitt vergrößern.

### `fullPageScrollTimeout`

- **Typ:** `number`
- **Obligatorisch:** Nein
- **Standard:** `1500`
- **Verwendet mit:** Nur für [`saveFullPageScreen`](./methods#savefullpagescreen) oder [`saveTabbablePage`](./methods#savetabbablepage)
- **Unterstützt:** Web

Das Timeout in Millisekunden, das nach einem Scroll gewartet werden soll. Dies kann helfen, Seiten mit Lazy Loading zu identifizieren.

### `hideAfterFirstScroll`

- **Typ:** `array`
- **Obligatorisch:** Nein
- **Verwendet mit:** Nur für [`saveFullPageScreen`](./methods#savefullpagescreen) oder [`saveTabbablePage`](./methods#savetabbablepage)
- **Unterstützt:** Web

Diese Methode blendet ein oder mehrere Elemente aus, indem die Eigenschaft `visibility: hidden` hinzugefügt wird, indem ein Array von Elementen bereitgestellt wird.
Dies ist praktisch, wenn eine Seite beispielsweise fixierte Elemente enthält, die mit der Seite scrollen, aber einen störenden Effekt haben, wenn ein Vollbild-Screenshot gemacht wird.

### `waitForFontsLoaded`

- **Typ:** `boolean`
- **Obligatorisch:** Nein
- **Standard:** `true`
- **Verwendet mit:** Allen [Methoden](./methods)
- **Unterstützt:** Web, Hybrid App (Webview)

Schriftarten, einschließlich Drittanbieter-Schriftarten, können synchron oder asynchron geladen werden. Asynchrones Laden bedeutet, dass Schriftarten möglicherweise erst geladen werden, nachdem WebdriverIO festgestellt hat, dass eine Seite vollständig geladen wurde. Um Probleme mit der Schriftartendarstellung zu vermeiden, wartet dieses Modul standardmäßig darauf, dass alle Schriftarten geladen werden, bevor ein Screenshot aufgenommen wird.

## Vergleichs-(Prüf)-Optionen

Vergleichsoptionen sind Optionen, die die Art und Weise beeinflussen, wie der Vergleich durch [ResembleJS](https://github.com/Huddle/Resemble.js) ausgeführt wird.

:::info HINWEIS

- Alle Optionen aus den [Speicher-Optionen](#speicher-optionen) können für die Vergleichsmethoden verwendet werden
- Alle Vergleichsoptionen können während der Service-Instanziierung **oder** für jede einzelne Prüfmethode verwendet werden. Wenn eine Methodenoption den gleichen Schlüssel hat wie eine Option, die während der Instanziierung des Services gesetzt wurde, überschreibt die Methoden-Vergleichsoption den Wert der Service-Vergleichsoption.
- Alle Optionen können verwendet werden für:
  - Web
  - Hybrid App
  - Native App

:::

### `ignoreAlpha`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Vergleicht Bilder und verwirft Alpha.

### `blockOutSideBar`

- **Typ:** `boolean`
- **Standard:** `true`
- **Obligatorisch:** Nein
- **Bemerkung:** _Kann nur für `checkScreen()` verwendet werden. Dies ist **nur für iPad**_

Blockiert automatisch die Seitenleiste für iPads im Querformat während der Vergleiche. Dies verhindert Fehler bei der nativen Tab-/Privat-/Lesezeichen-Komponente.

### `blockOutStatusBar`

- **Typ:** `boolean`
- **Standard:** `true`
- **Obligatorisch:** Nein
- **Bemerkung:** _Dies ist **nur für Mobile**_

Blockiert automatisch die Status- und Adressleiste während der Vergleiche. Dies verhindert Fehler bei Zeit-, WLAN- oder Batteriestatus.

### `blockOutToolBar`

- **Typ:** `boolean`
- **Standard:** `true`
- **Obligatorisch:** Nein
- **Bemerkung:** _Dies ist **nur für Mobile**_

Blockiert automatisch die Werkzeugleiste.

### `ignoreAntialiasing`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Vergleicht Bilder und verwirft Anti-Aliasing.

### `ignoreColors`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Auch wenn die Bilder farbig sind, vergleicht der Vergleich zwei Schwarz/Weiß-Bilder.

### `ignoreLess`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Vergleicht Bilder mit `red = 16, green = 16, blue = 16, alpha = 16, minBrightness=16, maxBrightness=240`

### `ignoreNothing`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Vergleicht Bilder mit `red = 0, green = 0, blue = 0, alpha = 0, minBrightness=0, maxBrightness=255`

### `rawMisMatchPercentage`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Wenn true, wird der Rückgabeprozentsatz wie `0.12345678` sein, Standard ist `0.12`

### `returnAllCompareData`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Dies gibt alle Vergleichsdaten zurück, nicht nur den Prozentsatz der Unterschiede.

### `saveAboveTolerance`

- **Typ:** `number`
- **Standard:** `0`
- **Obligatorisch:** Nein

Zulässiger Wert von `misMatchPercentage`, der verhindert, dass Bilder mit Unterschieden gespeichert werden.

### `largeImageThreshold`

- **Typ:** `number`
- **Standard:** `0`
- **Obligatorisch:** Nein

Der Vergleich großer Bilder kann zu Leistungsproblemen führen.
Wenn hier eine Zahl für die Anzahl der Pixel angegeben wird (höher als 0), überspringt der Vergleichsalgorithmus Pixel, wenn die Bildbreite oder -höhe größer als `largeImageThreshold` Pixel ist.

### `scaleImagesToSameSize`

- **Typ:** `boolean`
- **Standard:** `false`
- **Obligatorisch:** Nein

Skaliert zwei Bilder auf die gleiche Größe vor der Ausführung des Vergleichs. Es wird dringend empfohlen, `ignoreAntialiasing` und `ignoreAlpha` zu aktivieren.

## Ordner-Optionen

Der Baseline-Ordner und die Screenshot-Ordner (aktuell, diff) sind Optionen, die während der Instanziierung des Plugins oder der Methode festgelegt werden können. Um die Ordneroptionen für eine bestimmte Methode festzulegen, übergeben Sie Ordneroptionen an das Methoden-Options-Objekt. Dies kann verwendet werden für:

- Web
- Hybrid App
- Native App

```ts
import path from 'node:path'

const methodOptions = {
    actualFolder: path.join(process.cwd(), 'customActual'),
    baselineFolder: path.join(process.cwd(), 'customBaseline'),
    diffFolder: path.join(process.cwd(), 'customDiff'),
}

// You can use this for all methods
await expect(
    await browser.checkFullPageScreen("checkFullPage", methodOptions)
).toEqual(0)
```

### `actualFolder`

- **Typ:** `string`
- **Obligatorisch:** Nein

Ordner für den Snapshot, der im Test aufgenommen wurde.

### `baselineFolder`

- **Typ:** `string`
- **Obligatorisch:** Nein

Ordner für das Baseline-Bild, das für den Vergleich verwendet wird.

### `diffFolder`

- **Typ:** `string`
- **Obligatorisch:** Nein

Ordner für den von ResembleJS gerenderten Bildunterschied.
