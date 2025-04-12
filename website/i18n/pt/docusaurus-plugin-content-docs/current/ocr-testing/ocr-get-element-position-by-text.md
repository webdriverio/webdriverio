---
id: ocr-get-element-position-by-text
title: ocrGetElementPositionByText
---

Obtenha a posição de um texto na tela. O comando pesquisará o texto fornecido e tentará encontrar uma correspondência com base na Lógica Fuzzy do [Fuse.js](https://fusejs.io/). Isso significa que se você fornecer um erro de digitação a um seletor, ou se o texto encontrado não for 100% correspondente, ele ainda tentará retornar um elemento. Veja os [logs](#logs) abaixo.

## Uso

```js
const result = await browser.ocrGetElementPositionByText("Username");

console.log("result = ", JSON.stringify(result, null, 2));
```

## Saida

### Resultado

```logs
result = {
  "dprPosition": {
    "left": 373,
    "top": 606,
    "right": 439,
    "bottom": 620
  },
  "filePath": ".tmp/ocr/desktop-1716658199410.png",
  "matchedString": "Started",
  "originalPosition": {
    "left": 373,
    "top": 606,
    "right": 439,
    "bottom": 620
  },
  "score": 85.71,
  "searchValue": "Start3d"
}
```

### Logs

```log
# Ainda encontrando uma correspondência, embora tenhamos pesquisado por "Start3d" e o texto encontrado tenha sido "Started"
[0-0] 2024-05-25T17:29:59.179Z INFO webdriver: COMMAND ocrGetElementPositionByText(<0>)
......................
[0-0] 2024-05-25T17:29:59.993Z INFO @wdio/ocr-service:ocrGetElementPositionByText: Multiple matches were found based on the word "Start3d". The match "Started" with score "85.71%" will be used.
```

## Opções

### `text`

- **Tipo:** `string`
- **Obrigatório:** sim

O texto que você deseja pesquisar para clicar.

#### Exemplo

```js
await browser.ocrGetElementPositionByText({ text: "WebdriverIO" });
```

### `contrast`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** `0.25`

Quanto maior o contraste, mais escura a imagem e vice-versa. Isso pode ajudar a encontrar texto em uma imagem. Ele aceita valores entre `-1` e `1`.

#### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    contrast: 0.5,
});
```

### `haystack`

- **Tipo:** `número`
- **Obrigatório:** `WebdriverIO.Element | ChainablePromiseElement | Rectangle`

Esta é a área de pesquisa na tela onde o OCR precisa procurar texto. Pode ser um elemento ou um retângulo contendo `x`, `y`, `largura` e `altura`

#### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    haystack: $("elementSelector"),
});

// OU
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    haystack: await $("elementSelector"),
});

// OU
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
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
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
});
```

### `fuzzyFindOptions`

Você pode alterar a lógica difusa para encontrar texto com as seguintes opções. Isso pode ajudar a encontrar uma correspondência melhor

#### `fuzzyFindOptions.distance`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** 100

Determina o quão próxima a correspondência deve ser do local difuso (especificado pelo local). Uma correspondência exata de letras, que é a distância de caracteres do local difuso, seria considerada uma incompatibilidade completa. Uma distância de 0 exige que a correspondência esteja no local exato especificado. Uma distância de 1000 exigiria que uma correspondência perfeita estivesse dentro de 800 caracteres do local a ser encontrado usando um limite de 0,8.

##### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        distance: 20,
    },
});
```

#### `fuzzyFindOptions.location`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** 0

Determina aproximadamente onde no texto o padrão deve ser encontrado.

##### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        location: 20,
    },
});
```

#### `fuzzyFindOptions.threshold`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** 0.6

Em que ponto o algoritmo de correspondência desiste? Um limite de 0 requer uma correspondência perfeita (de letras e localização), um limite de 1,0 corresponderia a qualquer coisa.

##### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        threshold: 0.8,
    },
});
```

#### `fuzzyFindOptions.isCaseSensitive`

- **Tipo:** `boolean`
- **Obrigatório:** não
- **Padrão:** falso

Se a pesquisa deve diferenciar maiúsculas de minúsculas.

##### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        isCaseSensitive: true,
    },
});
```

#### `fuzzyFindOptions.minMatchCharLength`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** 2

Somente as correspondências cujo comprimento exceda esse valor serão retornadas. (Por exemplo, se você quiser ignorar correspondências de caracteres individuais no resultado, defina-o como 2)

##### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        minMatchCharLength: 5,
    },
});
```

#### `fuzzyFindOptions.findAllMatches`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** false

Quando `true`, a função de correspondência continuará até o final de um padrão de pesquisa, mesmo que uma correspondência perfeita já tenha sido localizada na string.

##### Exemplo

```js
await browser.ocrGetElementPositionByText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
