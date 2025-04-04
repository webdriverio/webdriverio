---
id: getting-started
title: Getting Started
---

## Installation

The easiest way is to keep `@wdio/ocr-service` as a dependency in your `package.json` via.

```bash npm2yarn
npm install @wdio/ocr-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](../gettingstarted)

:::note
This module uses Tesseract as an OCR engine. By default, it will verify if you have a local installation of Tesseract installed on your system, if so, it will use that. If not, it will use the [Node.js Tesseract.js](https://github.com/naptha/tesseract.js) module which is automatically installed for you.

If you want to speed up the image processing then the advice is to use a locally installed version of Tesseract. See also [Test execution time](./more-test-optimization#using-a-local-installation-of-tesseract).
:::

Instruction on how to install Tesseract as a system dependency on your local system can be found [here](https://tesseract-ocr.github.io/tessdoc/Installation.html).

:::caution
For installation questions/errors with Tesseract please refer to the
[Tesseract](https://github.com/tesseract-ocr/tesseract) project.
:::

## Typescript support

Ensure that you add `@wdio/ocr-service` to your `tsconfig.json` configuration file.

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/ocr-service"]
    }
}
```

## Configuration

To use the service you need to add `ocr` to your services array in `wdio.conf.ts`

```js
// wdio.conf.js
import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    //...
    services: [
        // your other services
        [
            "ocr",
            {
                contrast: 0.25,
                imagesFolder: ".tmp/",
                language: "eng",
            },
        ],
    ],
});
```

### Configuration Options

#### `contrast`

-   **Type:** `number`
-   **Mandatory:** No
-   **Default:** `0.25`

The higher the contrast, the darker the image and vice versa. This can help to find text in an image. It accepts values between `-1` and `1`.

#### `imagesFolder`

-   **Type:** `string`
-   **Mandatory:** No
-   **Default:** `{project-root}/.tmp/ocr`

The folder where the OCR results are stored.

:::note
If you provide a custom `imagesFolder`, then the service will automatically add the subfolder `ocr` to it.
:::

#### `language`

-   **Type:** `string`
-   **Mandatory:** No
-   **Default:** `eng`

The language that Tesseract will recognize. More info can be found [here](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions) and the supported languages can be found [here](https://github.com/webdriverio/visual-testing/blob/main/packages/ocr-service/src/utils/constants.ts).

## Logs

This module will automatically add extra logs to the WebdriverIO logs. It writes to the `INFO` and `WARN` logs with the name `@wdio/ocr-service`.
Examples can be found below.

```log
...............
[0-0] 2024-05-24T06:55:12.739Z INFO @wdio/ocr-service: Adding commands to global browser
[0-0] 2024-05-24T06:55:12.750Z INFO @wdio/ocr-service: Adding browser command "ocrGetText" to browser object
[0-0] 2024-05-24T06:55:12.751Z INFO @wdio/ocr-service: Adding browser command "ocrGetElementPositionByText" to browser object
[0-0] 2024-05-24T06:55:12.751Z INFO @wdio/ocr-service: Adding browser command "ocrWaitForTextDisplayed" to browser object
[0-0] 2024-05-24T06:55:12.751Z INFO @wdio/ocr-service: Adding browser command "ocrClickOnText" to browser object
[0-0] 2024-05-24T06:55:12.751Z INFO @wdio/ocr-service: Adding browser command "ocrSetValue" to browser object
...............
[0-0] 2024-05-24T06:55:13.667Z INFO @wdio/ocr-service:getData: Using system installed version of Tesseract
[0-0] 2024-05-24T06:55:14.019Z INFO @wdio/ocr-service:getData: It took '0.351s' to process the image.
[0-0] 2024-05-24T06:55:14.019Z INFO @wdio/ocr-service:getData: The following text was found through OCR:
[0-0]
[0-0] IQ Docs API Blog Contribute Community Sponsor Next-gen browser and mobile automation Welcome! How can | help? i test framework for Node.js Get Started Why WebdriverI0? View on GitHub Watch on YouTube
[0-0] 2024-05-24T06:55:14.019Z INFO @wdio/ocr-service:getData: OCR Image with found text can be found here:
[0-0]
[0-0] .tmp/ocr/desktop-1716533713585.png
[0-0] 2024-05-24T06:55:14.019Z INFO @wdio/ocr-service:ocrGetElementPositionByText: We searched for the word "Get Started" and found one match "Started" with score "63.64
...............
```
