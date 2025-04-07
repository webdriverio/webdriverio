---
id: ocr-click-on-text
title: ocrClickOnText
---

Clique em um elemento com base nos textos fornecidos. O comando pesquisará o texto fornecido e tentará encontrar uma correspondência com base na Lógica Fuzzy do [Fuse.js](https://fusejs.io/). Isso significa que se você fornecer um erro de digitação a um seletor, ou se o texto encontrado não for 100% correspondente, ele ainda tentará retornar um elemento. Veja os [logs](#logs) abaixo.

## Uso

```js
await browser.ocrClickOnText({ text: "Start3d" });
```

## Saída

### Logs

```log
# Still finding a match even though we searched for "Start3d" and the found text was "Started"
[0-0] 2024-05-25T05:05:20.096Z INFO webdriver: COMMAND ocrClickOnText(<object>)
......................
[0-0] 2024-05-25T05:05:21.022Z INFO @wdio/ocr-service:ocrGetElementPositionByText: Multiple matches were found based on the word "Start3d". The match "Started" with score "85.71%" will be used.
```

### Imagem

Você encontrará uma imagem em seu (default)[`imagesFolder`](./getting-started#imagesfolder) com um alvo para mostrar onde o módulo clicou.

![Etapas do processo](/img/ocr/ocr-click-on-text-target.jpg)

## Opções

### `text`

- **Tipo:** `string`
- **Obrigatório:** sim

O texto que você deseja pesquisar para clicar.

#### Exemplo

```js
await browser.ocrClickOnText({ text: "WebdriverIO" });
```

### `clickDuration`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** `500` milissegundos

Esta é a duração do clique. Se quiser, você também pode criar um "clique longo" aumentando o tempo.

#### Exemplo

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
    clickDuration: 3000, // Isso dura 3 segundos
});
```

### `contrast`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** `0.25`

Quanto maior o contraste, mais escura a imagem e vice-versa. Isso pode ajudar a encontrar texto em uma imagem. Ele aceita valores entre `-1` e `1`.

#### Exemplo

```js
await browser.ocrClickOnText({
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
    haystack: $("elementSelector"),
});

// OU
await browser.ocrClickOnText({
    text: "WebdriverIO",
    haystack: await $("elementSelector"),
});

// OU
await browser.ocrClickOnText({
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
});
```

### `relativePosition`

- **Tipo:** `objeto`
- **Obrigatório:** não

Você pode clicar na tela relativa ao elemento correspondente. Isso pode ser feito com base em pixels relativos `acima`, `direita`, `abaixo` ou `esquerda` do elemento correspondente

:::note

As seguintes combinações são permitidas

- propriedades individuais
- `above` + `left` or `above` + `right`
- `below` + `left` or `below` + `right`

As seguintes combinações **NÃO** são permitidas

- `above` plus `below`
- `left` plus `right`

:::

#### `relativePosition.above`

- **Tipo:** `número`
- **Obrigatório:** não

Clique x pixels `acima` do elemento correspondente.

##### Exemplo

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
    relativePosition: {
        above: 100,
    },
});
```

#### `relativePosition.right`

- **Tipo:** `número`
- **Obrigatório:** não

Clique x pixels `à direita` do elemento correspondente.

##### Exemplo

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
    relativePosition: {
        right: 100,
    },
});
```

#### `relativePosition.below`

- **Tipo:** `número`
- **Obrigatório:** não

Clique x pixels `abaixo` do elemento correspondente.

##### Exemplo

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
    relativePosition: {
        below: 100,
    },
});
```

#### `relativePosition.left`

- **Tipo:** `número`
- **Obrigatório:** não

Clique em x pixels `à esquerda` do elemento correspondente.

##### Examplo

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
    relativePosition: {
        left: 100,
    },
});
```

### `fuzzyFindOptions`

Você pode alterar a lógica difusa para encontrar texto com as seguintes opções. Isso pode ajudar a encontrar uma correspondência melhor`fuzzyFindOptions.distance`

#### `fuzzyFindOptions.distance`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** 100

Determina o quão próxima a correspondência deve ser do local difuso (especificado pelo local). Uma correspondência exata de letras, que é a distância de caracteres do local difuso, seria considerada uma incompatibilidade completa. Uma distância de 0 exige que a correspondência esteja no local exato especificado. Uma distância de 1000 exigiria que uma correspondência perfeita estivesse dentro de 800 caracteres do local a ser encontrado usando um limite de 0,8.

##### Exemplo

```js
await browser.ocrClickOnText({
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
await browser.ocrClickOnText({
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        threshold: 0.8,
    },
});
```

#### `fuzzyFindOptions.isCaseSensitive`

- **Tipo:** `boolean`
- **Obrigatório:** não
- **Padrão:** false

Se a pesquisa deve diferenciar maiúsculas de minúsculas.

##### Exemplo

```js
await browser.ocrClickOnText({
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
await browser.ocrClickOnText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        minMatchCharLength: 5,
    },
});
```

#### `fuzzyFindOptions.findAllMatches`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** falso

Quando `true`, a função de correspondência continuará até o final de um padrão de pesquisa, mesmo que uma correspondência perfeita já tenha sido localizada na string.

##### Exemplo

```js
await browser.ocrClickOnText({
    text: "WebdriverIO",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
