---
id: getting-started
title: Getting Started
---

Welcome to the `wdio-ocr-service` documentation. It will help you to get started fast. If you run into problems, you
can find help and answers on my [wdio-ocr-service Gitter Channel](https://gitter.im/wswebcreation/wdio-ocr-service) or
you can hit me on [Twitter](https://twitter.com/wswebcreation).

## Installation
The easiest way is to keep `wdio-ocr-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-ocr-service": "1.1.2"
  }
}
```

You can simply do it by:

```bash
npm install wdio-ocr-service@next --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

:::note
This module uses Tesseract as an OCR engine. By default, it will verify if you have a local installation of
Tesseract installed on your system, if so, it will use that. If not, it will use the
[Node.js Tesseract.js](https://github.com/naptha/tesseract.js) module which is automatically installed for you.
:::

Instruction on how to install Tesseract on your local system can be found
[here](https://tesseract-ocr.github.io/tessdoc/Installation.html).

:::caution
For installation questions / errors with Tesseract please refer to the
[Tesseract](https://github.com/tesseract-ocr/tesseract) project.
:::


## Configuration
In order to use the service you need to add `ocr` to your services array in `wdio.conf.js`

```js
// wdio.conf.js
exports.config = {
  //...
  services: [
    // your other services
    [
      'ocr',
      {
        // The OCR options
        ocrImagesPath: 'ocr-images/',
        ocrLanguage: 'eng'
      },
    ]
  ],
};
```

### Configuration Options
The following configuration options are supported and are all optional.

| Option | Default | Description |
| --- | --- | --- |
| ocrImagesPath | `{project-root}/.tmp` | The folder where the OCR-results are stored |
| ocrLanguage | `eng` | The language that Tesseract will recognize. More info [here.](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html)

## Logs
This module will automatically extra logs to the WebdriverIO logs. It writes to the `INFO` and `WARN` logs with the name
`wdio-ocr-service`.
Examples can be found below.

```log
..............................
[0-0] 2021-04-07T09:51:06.344Z INFO webdriver: COMMAND ocrWaitForTextDisplayed("<Screenshot[base64]>", <object>)
[0-0] 2021-04-07T09:51:06.346Z INFO webdriver: COMMAND takeScreenshot()
[0-0] 2021-04-07T09:51:06.346Z INFO webdriver: [GET] http://127.0.0.1:4723/session/b4001383-bb09-46dc-84f9-7c15912ac248/screenshot
[0-0] 2021-04-07T09:51:06.427Z INFO webdriver: RESULT iVBORw0KGgoAAAANSUhEUgAAAzwAAAcACAIAAACaY9F8AAAAAXNSR0IArs4c6...
[0-0] 2021-04-07T09:51:07.112Z INFO wdio-ocr-service: Using system installed version of Tesseract
[0-0] 2021-04-07T09:51:07.367Z INFO wdio-ocr-service: It took '0.255s' to process the image.
[0-0] 2021-04-07T09:51:07.367Z INFO wdio-ocr-service: The following text was found through OCR:



Username
Password
LOGIN


[0-0] 2021-04-07T09:51:07.804Z INFO wdio-ocr-service: OCR Image with found text can be found here:

ocr-images/ios-1617789066698.png
[0-0] 2021-04-07T09:51:07.806Z INFO webdriver: COMMAND ocrSetValue("Usernames", "standard_user", <object>)
[0-0] 2021-04-07T09:51:07.807Z INFO webdriver: RESULT true
[0-0] 2021-04-07T09:51:07.811Z INFO wdio-ocr-service: We searched for the word "Usernames" and found one match "Username" with score "88.89%"
...............
```
