---
id: ocr-wait-for-text-displayed
title: ocrWaitForTextDisplayed
---

Aguarde até que um texto específico seja exibido na tela.

## Uso

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
});
```

## Saída

### Logs

```log
[0-0] 2024-05-26T04:32:52.005Z INFO webdriver: COMMAND ocrWaitForTextDisplayed(<object>)
......................
# ocrWaitForTextDisplayed uses ocrGetElementPositionByText under the hood, that is why you see the command ocrGetElementPositionByText in the logs
[0-0] 2024-05-26T04:32:52.735Z INFO @wdio/ocr-service:ocrGetElementPositionByText: Multiple matches were found based on the word "specFileRetries". The match "specFileRetries" with score "100%" will be used.
```

## Opções

### `text`

- **Tipo:** `string`
- **Obrigatório:** sim

O texto que você deseja pesquisar para clicar.

#### Exemplo

```js
await browser.ocrWaitForTextDisplayed({ text: "specFileRetries" });
```

### `timeout`

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** 18000 (18 segundos)

Tempo em milissegundos. Esteja ciente de que o processo de OCR pode levar algum tempo, então não defina um tempo muito baixo.

#### Exemplo

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries"
    timeout: 25000 //espere por 25 segundos
});
```

### `Mensagem de tempo limite`

- **Tipo:** `string`
- **Obrigatório:** não
- **Padrão:** `Não foi possível encontrar o texto "{selector}" dentro do tempo solicitado.`

Ela substitui a mensagem de erro padrão.

#### Exemplo

```js
await browser.ocrWaitForTextDisplayed({
text: "specFileRetries"
timeoutMsg: "Minha nova mensagem de tempo limite."
});
```

### \`contrast

- **Tipo:** `número`
- **Obrigatório:** não
- **Padrão:** `0,25`

Quanto maior o contraste, mais escura a imagem e vice-versa. Isso pode ajudar a encontrar texto em uma imagem. Aceita valores entre `-1` e `1`.

#### Exemplo

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    contrast: 0.5,
});
```

### `haystack`

- **Tipo:** `número`
- **Mandatory:** `WebdriverIO.Element | ChainablePromiseElement | Rectangle`

Esta é a área de pesquisa na tela onde o OCR precisa procurar texto. Pode ser um elemento ou um retângulo contendo `x`, `y`, `largura` e `altura`

#### Exemplo

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    haystack: $("elementSelector"),
});

// OU
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    haystack: await $("elementSelector"),
});

// OU
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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

The language that Tesseract will recognize. A linguagem que o Tesseract reconhecerá.

#### Exemplo

```js
import { SUPPORTED_OCR_LANGUAGES } from "@wdio/ocr-service";
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
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
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    fuzzyFindOptions: {
        minMatchCharLength: 5,
    },
});
```

#### `fuzzyFindOptions.findAllMatches`

- **Tipo:** \`número
- **Obrigatório:** não
- **Padrão:** falso

Quando `true`, a função de correspondência continuará até o final de um padrão de pesquisa, mesmo que uma correspondência perfeita já tenha sido localizada na string.

##### Exemplo

```js
await browser.ocrWaitForTextDisplayed({
    text: "specFileRetries",
    fuzzyFindOptions: {
        findAllMatches: 100,
    },
});
```
