---
id: methods
title: Methods
---

The following methods are added to the global WebdriverIO [`browser`](/docs/api/browser)-object.

## Save Methods

:::info TIP
Only use the Save Methods when you **don't** want to compare screens, but only want to have an element-/screenshot.
:::

### `saveElement`

Saves an image of an element.

#### Usage

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

#### Parameters

-   **`element`:**
    -   **Mandatory:** Yes
    -   **Type:** WebdriverIO Element
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveElementOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Save Options](./method-options#save-options)

#### Output:

See the [Test Output](./test-output#savescreenelementfullpagescreen) page.

### `saveScreen`

Saves an image of a viewport.

#### Usage

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

#### Parameters
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveScreenOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Save Options](./method-options#save-options)

#### Output:

See the [Test Output](./test-output#savescreenelementfullpagescreen) page.

### `saveFullPageScreen`

#### Usage

Saves an image of the complete screen.

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

#### Parameters
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveFullPageScreenOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Save Options](./method-options#save-options)

#### Output:

See the [Test Output](./test-output#savescreenelementfullpagescreen) page.

### `saveTabbablePage`

Saves an image of the complete screen with the tabbable lines and dots.

#### Usage

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

#### Parameters
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveTabbableOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Save Options](./method-options#save-options)

#### Output:

See the [Test Output](./test-output#savescreenelementfullpagescreen) page.

## Check Methods

:::info TIP
When the `check`-methods are used for the first time you will see the below warning in the logs. This means you don't need to combine the `save`- and `check`-methods if you want to create your baseline.

```shell
#####################################################################################
 Baseline image not found, save the actual image manually to the baseline.
 The image can be found here:
 /Users/wswebcreation/project/.tmp/actual/desktop_chrome/examplePage-chrome-latest-1366x768.png
 If you want the module to auto save a non existing image to the baseline you
 can provide 'autoSaveBaseline: true' to the options.
#####################################################################################
```

:::

### `checkElement`

Compare an image of an element against a baseline image.

#### Usage

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

#### Parameters
-   **`element`:**
    -   **Mandatory:** Yes
    -   **Type:** WebdriverIO Element
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkElementOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See the [Test Output](./test-output#checkscreenelementfullpagescreen) page.

### `checkScreen`

Compares an image of a viewport against a baseline image.

#### Usage

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

#### Parameters
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkScreenOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See the [Test Output](./test-output#checkscreenelementfullpagescreen) page.

### `checkFullPageScreen`

Compares an image of the complete screen against a baseline image.

#### Usage

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

#### Parameters
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkFullPageOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See the [Test Output](./test-output#checkscreenelementfullpagescreen) page.

### `checkTabbablePage`

Compares an image of the complete screen with the tabbable lines and dots against a baseline image.

#### Usage

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

#### Parameters
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkTabbableOptions`:**
    -   **Mandatory:** No
    -   **Type:** an object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See the [Test Output](./test-output#checkscreenelementfullpagescreen) page.
