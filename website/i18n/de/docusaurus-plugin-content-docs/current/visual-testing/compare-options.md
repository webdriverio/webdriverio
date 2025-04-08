---
id: compare-options
title: Vergleichsoptionen
---

Vergleichsoptionen sind Optionen, die die Art und Weise beeinflussen, wie der Vergleich durch [ResembleJS](https://github.com/Huddle/Resemble.js) ausgeführt wird.

:::info HINWEIS
Alle Vergleichsoptionen können während der Dienstinstanziierung oder für jeden einzelnen `checkElement`, `checkScreen` und `checkFullPageScreen` verwendet werden. Wenn eine Methodenoption den gleichen Schlüssel hat wie eine Option, die während der Instanziierung des Dienstes festgelegt wurde, dann überschreibt die Vergleichsoption der Methode den Wert der Vergleichsoption des Dienstes.
:::

### `ignoreAlpha`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Vergleicht Bilder und ignoriert Alpha-Werte.

### `blockOutSideBar`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann nur für `checkScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung. Dies ist **nur für iPad**_

Blockiert automatisch die Seitenleiste für iPads im Querformat während der Vergleiche. Dies verhindert Fehler bei der nativen Tab/Privat/Lesezeichen-Komponente.

### `blockOutStatusBar`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung. Dies ist **nur für Mobilgeräte**_

Blockiert automatisch die Status- und Adressleiste während der Vergleiche. Dies verhindert Fehler bei der Anzeige von Zeit, WLAN oder Batteriestatus.

### `blockOutToolBar`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung. Dies ist **nur für Mobilgeräte**_

Blockiert automatisch die Werkzeugleiste.

### `ignoreAntialiasing`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Vergleicht Bilder und ignoriert Anti-Aliasing.

### `ignoreColors`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Obwohl die Bilder farbig sind, vergleicht der Vergleich 2 Schwarz-Weiß-Bilder.

### `ignoreLess`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Vergleicht Bilder mit den Parametern `rot = 16, grün = 16, blau = 16, alpha = 16, minHelligkeit=16, maxHelligkeit=240`.

### `ignoreNothing`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Vergleicht Bilder mit den Parametern `rot = 0, grün = 0, blau = 0, alpha = 0, minHelligkeit=0, maxHelligkeit=255`.

### `ignoreTransparentPixel`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Vergleicht Bilder und ignoriert alle Pixel, die in einem der Bilder eine gewisse Transparenz aufweisen.

### `rawMisMatchPercentage`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Bei "true" wird der Prozentsatz als `0.12345678` zurückgegeben, standardmäßig ist es `0.12`.

### `returnAllCompareData`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Dies gibt alle Vergleichsdaten zurück, nicht nur den Prozentsatz der Nichtübereinstimmung.

### `saveAboveTolerance`

- **Typ:** `number`
- **Standard:** `0`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Zulässiger Wert des `misMatchPercentage`, der das Speichern von Bildern mit Unterschieden verhindert.

### `largeImageThreshold`

- **Typ:** `number`
- **Standard:** `0`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Der Vergleich großer Bilder kann zu Leistungsproblemen führen.
Wenn hier eine Zahl für die Anzahl der Pixel (höher als 0) angegeben wird, überspringt der Vergleichsalgorithmus Pixel, wenn die Bildbreite oder -höhe größer als `largeImageThreshold` Pixel ist.

### `scaleImagesToSameSize`

- **Typ:** `boolean`
- **Standard:** `false`
- **Pflichtfeld:** nein
- **Bemerkung:** _Kann auch für `checkElement`, `checkScreen()` und `checkFullPageScreen()` verwendet werden. Es überschreibt die Plugin-Einstellung_

Skaliert 2 Bilder auf die gleiche Größe vor der Ausführung des Vergleichs. Es wird dringend empfohlen, `ignoreAntialiasing` und `ignoreAlpha` zu aktivieren.
