---
id: methods
title: Methoden
---

Die folgenden Methoden werden dem globalen WebdriverIO [`browser`](/docs/api/browser)-Objekt hinzugefügt.

## Speichermethoden

:::info TIPP
Verwenden Sie die Speichermethoden nur, wenn Sie Bildschirme **nicht** vergleichen, sondern nur einen Element-/Screenshot haben möchten.
:::

### `saveElement`

Speichert ein Bild eines Elements.

#### Verwendung

```ts
await browser.saveElement(
    // element
    await $('#element-selector'),
    // tag
    'your-reference',
    // saveElementOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser
- Mobile Browser
- Mobile Hybride Apps
- Mobile Native Apps

#### Parameter

- **`element`:**
  - **Obligatorisch:** Ja
  - **Typ:** WebdriverIO Element
- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`saveElementOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Speicheroptionen](./method-options#save-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#savescreenelementfullpagescreen).

### `saveScreen`

Speichert ein Bild eines Viewports.

#### Verwendung

```ts
await browser.saveScreen(
    // tag
    'your-reference',
    // saveScreenOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser
- Mobile Browser
- Mobile Hybride Apps
- Mobile Native Apps

#### Parameter

- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`saveScreenOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Speicheroptionen](./method-options#save-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#savescreenelementfullpagescreen).

### `saveFullPageScreen`

#### Verwendung

Speichert ein Bild des vollständigen Bildschirms.

```ts
await browser.saveFullPageScreen(
    // tag
    'your-reference',
    // saveFullPageScreenOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser
- Mobile Browser

#### Parameter

- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`saveFullPageScreenOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Speicheroptionen](./method-options#save-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#savescreenelementfullpagescreen).

### `saveTabbablePage`

Speichert ein Bild des vollständigen Bildschirms mit den tabulierbaren Linien und Punkten.

#### Verwendung

```ts
await browser.saveTabbablePage(
    // tag
    'your-reference',
    // saveTabbableOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser

#### Parameter

- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`saveTabbableOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Speicheroptionen](./method-options#save-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#savescreenelementfullpagescreen).

## Prüfmethoden

:::info TIPP

```shell
#####################################################################################
 Baseline-Bild nicht gefunden, speichern Sie das aktuelle Bild manuell als Baseline.
 Das Bild finden Sie hier:
 /Users/wswebcreation/project/.tmp/actual/desktop_chrome/examplePage-chrome-latest-1366x768.png
 Wenn Sie möchten, dass das Modul ein nicht existierendes Bild automatisch in der Baseline speichert,
 können Sie 'autoSaveBaseline: true' zu den Optionen hinzufügen.
#####################################################################################
```

:::

### `checkElement`

Vergleicht ein Bild eines Elements mit einem Baseline-Bild.

#### Verwendung

```ts
await browser.checkElement(
    // element
    '#element-selector',
    // tag
    'your-reference',
    // checkElementOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser
- Mobile Browser
- Mobile Hybride Apps
- Mobile Native Apps

#### Parameter

- **`element`:**
  - **Obligatorisch:** Ja
  - **Typ:** WebdriverIO Element
- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`checkElementOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Vergleichs-/Prüfoptionen](./method-options#compare-check-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#checkscreenelementfullpagescreen).

### `checkScreen`

Vergleicht ein Bild eines Viewports mit einem Baseline-Bild.

#### Verwendung

```ts
await browser.checkScreen(
    // tag
    'your-reference',
    // checkScreenOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser
- Mobile Browser
- Mobile Hybride Apps
- Mobile Native Apps

#### Parameter

- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`checkScreenOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Vergleichs-/Prüfoptionen](./method-options#compare-check-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#checkscreenelementfullpagescreen).

### `checkFullPageScreen`

Vergleicht ein Bild des vollständigen Bildschirms mit einem Baseline-Bild.

#### Verwendung

```ts
await browser.checkFullPageScreen(
    // tag
    'your-reference',
    // checkFullPageOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser
- Mobile Browser

#### Parameter

- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`checkFullPageOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Vergleichs-/Prüfoptionen](./method-options#compare-check-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#checkscreenelementfullpagescreen).

### `checkTabbablePage`

Vergleicht ein Bild des vollständigen Bildschirms mit den tabulierbaren Linien und Punkten mit einem Baseline-Bild.

#### Verwendung

```ts
await browser.checkTabbablePage(
    // tag
    'your-reference',
    // checkTabbableOptions
    {
        // ...
    }
);
```

#### Unterstützung

- Desktop-Browser

#### Parameter

- **`tag`:**
  - **Obligatorisch:** Ja
  - **Typ:** string
- **`checkTabbableOptions`:**
  - **Obligatorisch:** Nein
  - **Typ:** Ein Objekt mit Optionen, siehe [Vergleichs-/Prüfoptionen](./method-options#compare-check-options)

#### Ausgabe:

Siehe die Seite [Testausgabe](./test-output#checkscreenelementfullpagescreen).
