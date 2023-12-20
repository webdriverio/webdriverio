---
id: methods
title: Methods
---

The following methods are added to the Global WebdriverIO `browser`-object.

## Save Methods

:::info TIP
Only use the Save Methods when you **don't** want to compare screens, but only want to have an element-/screenshot.
:::

### `saveElement`

#### Usage

```ts
await browser.saveElement(
    // element
    "#element-selector",
    // tag
    "your-reference",
    // saveElementOptions
    {
        // ...
    }
);
```

-   **Description:** Saves an image of an element
-   **`element`:**
    -   **Mandatory:** Yes
    -   **Type:** WebdriverIO Element
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveElementOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Save Options](./method-options#save-options)

#### Output:

See [Test Output](./test-output#savescreenelementfullpagescreen)

### `saveScreen`

#### Usage

```ts
await browser.saveScreen(
    // tag
    "your-reference",
    // saveScreenOptions
    {
        // ...
    }
);
```

-   **Description:** Saves an image of a viewport
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveScreenOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Save Options](./method-options#save-options)

#### Output:

See [Test Output](./test-output#savescreenelementfullpagescreen)

### `saveFullPageScreen`

#### Usage

```ts
await browser.saveFullPageScreen(
    // tag
    "your-reference",
    // saveFullPageScreenOptions
    {
        // ...
    }
);
```

-   **Description:** Saves an image of the complete screen
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveFullPageScreenOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Save Options](./method-options#save-options)

#### Output:

See [Test Output](./test-output#savescreenelementfullpagescreen)

### `saveTabbablePage`

#### Usage

```ts
await browser.saveTabbablePage(
    // tag
    "your-reference",
    // saveTabbableOptions
    {
        // ...
    }
);
```

-   **Description:** Saves an image of the complete screen with the tabbable lines and dots
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`saveTabbableOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Save Options](./method-options#save-options)

#### Output:

See [Test Output](./test-output#savescreenelementfullpagescreen)

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

#### Usage

```ts
await browser.checkElement(
    // element
    "#element-selector",
    // tag
    "your-reference",
    // checkElementOptions
    {
        // ...
    }
);
```

-   **Description:** Compare an image of an element against a baseline image
-   **`element`:**
    -   **Mandatory:** Yes
    -   **Type:** WebdriverIO Element
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkElementOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See [Test Output](./test-output#checkscreenelementfullpagescreen)

### `checkScreen`

#### Usage

```ts
await browser.checkScreen(
    // tag
    "your-reference",
    // checkScreenOptions
    {
        // ...
    }
);
```

-   **Description:** Compares an image of a viewport against a baseline image
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkScreenOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See [Test Output](./test-output#checkscreenelementfullpagescreen)

### `checkFullPageScreen`

#### Usage

```ts
await browser.checkFullPageScreen(
    // tag
    "your-reference",
    // checkFullPageOptions
    {
        // ...
    }
);
```

-   **Description:** Compares an image of the complete screen against a baseline image
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkFullPageOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See [Test Output](./test-output#checkscreenelementfullpagescreen)

### `checkTabbablePage`

#### Usage

```ts
await browser.checkTabbablePage(
    // tag
    "your-reference",
    // checkTabbableOptions
    {
        // ...
    }
);
```

-   **Description:** Compares an image of the complete screen with the tabbable lines and dots against a baseline image
-   **`tag`:**
    -   **Mandatory:** Yes
    -   **Type:** string
-   **`checkTabbableOptions`:**
    -   **Mandatory:** No
    -   **Type:** object of options, see [Compare/Check Options](./method-options#compare-check-options)

#### Output:

See [Test Output](./test-output#checkscreenelementfullpagescreen)

<!-- /**
/**
 * Compare an image of an element
 */
checkElement(
    element: Element,
    tag: string,
    checkElementOptions?: WdioCheckElementMethodOptions
): Promise<Result>; -->
