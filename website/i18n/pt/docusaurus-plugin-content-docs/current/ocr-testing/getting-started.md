---
id: getting-started
title: Começando
---

## Instalação

A maneira mais fácil é manter `@wdio/ocr-service` como uma dependência no seu `package.json` via.

```bash npm2yarn
npm install @wdio/ocr-service --save-dev
```

Instruções sobre como instalar `WebdriverIO` podem ser encontradas [aqui.](../gettingstarted)

:::note
This module uses Tesseract as an OCR engine. By default, it will verify if you have a local installation of Tesseract installed on your system, if so, it will use that. If not, it will use the [Node.js Tesseract.js](https://github.com/naptha/tesseract.js) module which is automatically installed for you.

Se você quiser acelerar o processamento de imagens, o conselho é usar uma versão instalada localmente do Tesseract. Veja também [Tempo de execução do teste](./more-test-optimization#using-a-local-installation-of-tesseract).
:::

Instruções sobre como instalar o Tesseract como uma dependência do sistema em seu sistema local podem ser encontradas [aqui](https://tesseract-ocr.github.io/tessdoc/Installation.html).

:::caution
Para dúvidas/erros de instalação com o Tesseract, consulte o
projeto [Tesseract](https://github.com/tesseract-ocr/tesseract).
:::

## Suporte para texto datilografado

Certifique-se de adicionar `@wdio/ocr-service` ao seu arquivo de configuração `tsconfig.json`.

```json title="tsconfig.json"
{
"compilerOptions": {
"tipos": ["nó", "@wdio/globals/types", "@wdio/ocr-service"]
    }
}
```

## Configuração

Para usar o serviço, você precisa adicionar `ocr` ao seu array de serviços em `wdio.conf.ts`

```js
// wdio.conf.js
exports.config = {
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
};
```

### Opções de configuração

#### `contraste`

- **Tipo:** `número`
- **Obrigatório:** Não
- **Padrão:** `0,25`

Quanto maior o contraste, mais escura a imagem e vice-versa. Isso pode ajudar a encontrar texto em uma imagem. Ele aceita valores entre `-1` e `1`.

#### `imagesFolder`

- **Tipo:** `string`
- **Obrigatório:** Não
- **Default:** `{project-root}/.tmp/ocr`

A pasta onde os resultados do OCR são armazenados.

:::note
Se você fornecer uma `imagesFolder` personalizada, o serviço adicionará automaticamente a subpasta `ocr` a ela.
:::

#### `language`

- **Tipo:** `string`
- **Obrigatório:** Não
- **Default:** `eng`

A linguagem que o Tesseract reconhecerá. Mais informações podem ser encontradas [aqui](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions) e os idiomas suportados podem ser encontrados [aqui](https://github.com/webdriverio/visual-testing/blob/main/packages/ocr-service/src/utils/constants.ts).

## Logs

Este módulo adicionará automaticamente logs extras aos logs do WebdriverIO. Ele grava nos logs `INFO` e `WARN` com o nome `@wdio/ocr-service`.
Exemplos podem ser encontrados abaixo.

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
