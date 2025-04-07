---
id: ocr-get-text
title: ocrGetText
---

Obtenha o texto em uma imagem.

### Uso

```js
const result = await browser.ocrGetText();

console.log("result = ", JSON.stringify(result, null, 2));
```

## Saída

### Resultado

```logs
resultado = "VS docs API Blog Contribuir Comunidade Patrocinador v8 *Engishy CV} Q OQ G asearch Navegador de última geração e automação móvel Bem-vindo! Como posso | ajudar? i framework de teste para Node.js Comece Por que WebdriverI0? Ver no GitHub Assistir no YouTube"
```

### Logs

```log
[0-0] 2024-05-25T17:38:25.970Z INFO webdriver: COMMAND ocrGetText()
......................
[0-0] 2024-05-25T17:38:26.738Z INFO webdriver: RESULT VS docs API Blog Contribute Community Sponsor v8 *Engishy CV} Q OQ G asearch Next-gen browser and mobile automation Welcome! How can | help? i test framework for Node.js Get Started Why WebdriverI0? View on GitHub Watch on YouTube
```

## Opções

### `contrast`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** `0.25`

Quanto maior o contraste, mais escura a imagem e vice-versa. Isso pode ajudar a encontrar texto em uma imagem. Ele aceita valores entre `-1` e `1`.

#### Exemplo

```js
await browser.ocrGetText({ contrast: 0.5 });
```

### `haystack`

- **Tipo:** `número`
- **Obrigatório:** `WebdriverIO.Element | ChainablePromiseElement | Rectangle`

Esta é a área de pesquisa na tela onde o OCR precisa procurar texto. Pode ser um elemento ou um retângulo contendo `x`, `y`, `largura` e `altura`

#### Exemplo

```js
await browser.ocrGetText({ haystack: $("elementSelector") });

// OU
await browser.ocrGetText({ haystack: await $("elementSelector") });

// OU
await browser.ocrGetText({
    haystack: {
        x: 10,
        y: 50,
        width: 300,
        height: 75,
    },
});
```

### `language`

- **Tipo:** `string`
- **Obrigatório:** Não
- **Padrão:** `eng`

A linguagem que o Tesseract reconhecerá. Mais informações podem ser encontradas [aqui](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions) e os idiomas suportados podem ser encontrados [aqui](https://github.com/webdriverio/visual-testing/blob/main/packages/ocr-service/src/utils/constants.ts).

#### Exemplo

```js
import { SUPPORTED_OCR_LANGUAGES } from "@wdio/ocr-service";
await browser.ocrGetText({
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
});
```
