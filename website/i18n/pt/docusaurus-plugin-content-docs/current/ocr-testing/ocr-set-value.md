---
id: ocr-set-value
title: ocrSetValue
---

Envie uma sequência de pressionamentos de tecla para um elemento. Ele vai:

- detectar automaticamente o elemento
- coloque o foco no campo clicando nele
- defina o valor no campo

O comando pesquisará o texto fornecido e tentará encontrar uma correspondência com base na Lógica Fuzzy do [Fuse.js](https://fusejs.io/). Isso significa que se você fornecer um erro de digitação a um seletor, ou se o texto encontrado não for 100% correspondente, ele ainda tentará retornar um elemento. Veja os [logs](#logs) abaixo.

## Uso

```js
await brower.ocrSetValue({
    text: "docs",
    value: "specfileretries",
});
```

## Saída

### Logs

```log
[0-0] 2024-05-26T04:17:51.355Z INFO webdriver: COMMAND ocrSetValue(<object>)
......................
[0-0] 2024-05-26T04:17:52.356Z INFO @wdio/ocr-service:ocrGetElementPositionByText: We searched for the word "docs" and found one match "docs" with score "100%"
```

## Opções

### `text`

- **Tipo:** `string`
- **Obrigatório:** sim

O texto que você deseja pesquisar para clicar.

#### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
});
```

### `value`

- **Tipo:** `string`
- **Obrigatório:** sim

Valor a ser agregado.

#### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
});
```

### `submitValue`

- **Tipo:** `boolean`
- **Obrigatório:** não
- **Padrão:** `false`

Se o valor também precisar ser enviado no campo de entrada. Isso significa que um "ENTER" será enviado no final da string.

#### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    submitValue: true,
});
```

### `clickDuration`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** `500` milissegundos

Esta é a duração do clique. Se quiser, você também pode criar um "clique longo" aumentando o tempo.

#### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    clickDuration: 3000, // This is 3 seconds
});
```

### `contrast`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** `0.25`

Quanto maior o contraste, mais escura a imagem e vice-versa. Isso pode ajudar a encontrar texto em uma imagem. Ele aceita valores entre `-1` e `1`.

#### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    contrast: 0.5,
});
```

### `haystack`

- **Tipo:** `número`
- **Mandatory:** `WebdriverIO.Element | ChainablePromiseElement | Rectangle`

Esta é a área de pesquisa na tela onde o OCR precisa procurar texto. Pode ser um elemento ou um retângulo contendo `x`, `y`, `largura` e `altura`

#### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    haystack: $("elementSelector"),
});

// OU
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    haystack: await $("elementSelector"),
});

// OU
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
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
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    // Use Dutch as a language
    language: SUPPORTED_OCR_LANGUAGES.DUTCH,
});
```

### `relativePosition`

- **Tipo:** `objeto`
- **Obrigatório:** não

Você pode clicar na tela relativa ao elemento correspondente. Isso pode ser feito com base em pixels relativos  `above`, `right`, `below` ou`left` do elemento correspondente

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
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        above: 100,
    },
});
```

#### `relativePosition.right`

- **Tipo:** `número`
- **Obrigatório:** não

Clique x pixels `right` do elemento correspondente.

##### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        right: 100,
    },
});
```

#### `relativePosition.below`

- **Tipo:** `número`
- **Obrigatório:** não

Clique x pixels `below` do elemento correspondente.

##### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        below: 100,
    },
});
```

#### `relativePosition.left`

- **Tipo:** `número`
- **Obrigatório:** não

Clique em x pixels `left` do elemento correspondente.

##### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    relativePosition: {
        left: 100,
    },
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
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
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
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        location: 20,
    },
});
```

#### `fuzzyFindOptions.threshold`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** 0,6

Em que ponto o algoritmo de correspondência desiste? Um limite de 0 requer uma correspondência perfeita (de letras e localização), um limite de 1,0 corresponderia a qualquer coisa.

##### Exemplo

```js
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
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
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
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
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
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
await browser.ocrSetValue({
    text: "WebdriverIO",
    value: "The Value",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
