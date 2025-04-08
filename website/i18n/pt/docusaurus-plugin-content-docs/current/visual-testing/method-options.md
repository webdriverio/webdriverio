---
id: method-options
title: Opções do Método
---

As opções de métodos são as opções que podem ser definidas por [method](./methods). Se a opção tiver a mesma chave como uma opção que foi definida durante a instanciação do plugin, essa opção de método irá substituir o valor da opção do plugin.

## Salvar opções

### `disableBlinkingCursor`

- **Tipo:** `boolean`
- **Obrigatório:** Não
- **Padrão:** `false`
- **Suportado:** Web, aplicativo híbrido (Webview)

En/Disable all `input`, `textarea`, `[contenteditable]` caret "blinking" in the application. Se definido como `true`, o cursor será definido como `transparente` antes de fazer uma captura de tela
e será redefinido quando terminar

### `disableCSSAnimation`

- **Tipo:** `boolean`
- **Obrigatório:** Não
- **Obrigatório:** Não
- **Suportado:** Web, aplicativo híbrido (Webview)

En/Disable todas as animações CSS no aplicativo. Se definido como `true` todas as animações serão desabilitadas antes de fazer uma captura de tela
e serão redefinidas quando terminar

### `enableLayoutTesting`

- **Tipo:** `boolean`
- **Obrigatório:** Não
- **Padrão:** `false`
- **Usado com:** Todos os [métodos](./methods)
- **Suportado:** Web

Isso ocultará todo o texto em uma página, de modo que somente o layout será usado para comparação. A ocultação será feita adicionando o estilo `'color': 'transparent !important'` a **each** elemento.

Para a saída, consulte [Saída de teste](./test-output#enablelayouttesting)

:::info
Ao usar este sinalizador, cada elemento que contém texto (não apenas `p, h1, h2, h3, h4, h5, h6, span, a, li`, mas também `div|button|..`) receberá esta propriedade. Não há **nenhuma** opção para personalizar isso.
:::

### `hideScrollBars`

- **Tipo:** `boolean`
- **Obrigatório:** Não
- **Padrão:** `true`
- **Usado com:** Todos os [métodos](./methods)
- **Suportado:** Web, aplicativo híbrido (Webview)

Ocultar barra(s) de rolagem no aplicativo. Se definido como verdadeiro, todas as barras de rolagem serão desabilitadas antes de fazer uma captura de tela. O padrão é `true` para evitar problemas extras.

### `hideElements`

- **Tipo:** `array`
- **Obrigatório:** não
- **Usado com:** Todos os [métodos](./methods)
- **Suportado:** Web, aplicativo híbrido (Webview), aplicativo nativo

Este método pode ocultar 1 ou vários elementos adicionando a propriedade `visibility: hidden` a eles, fornecendo uma matriz de elementos.

### `removeElements`

- **Tipo:** `array`
- **Obrigatório:** não
- **Usado com:** Todos os [métodos](./methods)
- **Suportado:** Web, aplicativo híbrido (Webview), aplicativo nativo

Este método pode _remover_ 1 ou vários elementos adicionando a propriedade `display: none` a eles, fornecendo uma matriz de elementos.

### `resizeDimensions`

- **Tipo:** `objeto`
- **Obrigatório:** não
- **Padrão:** `{ top: 0, right: 0, bottom: 0, left: 0}`
- **Usado com:** Somente para [`saveElement`](./methods#saveelement) ou [`checkElement`](./methods#checkelement)
- **Suportado:** Web, aplicativo híbrido (Webview), Native App

Um objeto que precisa segurar uma `top`, `right`, `bottom` e`left`  quantidade de pixels necessários para tornar o recorte do elemento maior.

### `fullPageScrollTimeout`

- **Tipo:** `número`
- **Obrigatório:** Não
- **Padrão:** `1500`
- **Usado com:** Somente para [`saveFullPageScreen`](./methods#savefullpagescreen) ou [`saveTabbablePage`](./methods#savetabbablepage)
- **Suportado:** Web

O tempo limite em milissegundos para esperar após uma rolagem. Isso pode ajudar a identificar páginas com carregamento lento.

### `hideAfterFirstScroll`

- **Tipo:** `array`
- **Obrigatório:** não
- **Usado com:** Somente para [`saveFullPageScreen`](./methods#savefullpagescreen) ou [`saveTabbablePage`](./methods#savetabbablepage)
- **Suportado:** Web

Este método ocultará um ou vários elementos adicionando a propriedade `visibility: hidden` a eles, fornecendo uma matriz de elementos.
Isso será útil quando uma página, por exemplo, contiver elementos fixos que rolarão com a página se ela for rolada, mas causarão um efeito irritante quando uma captura de tela de página inteira for feita.

### `waitForFontsLoaded`

- **Tipo:** `boolean`
- **Obrigatório:** Não
- **Padrão:** `true`
- **Usado com:** Todos os [métodos](./methods)
- **Suportado:** Web, aplicativo híbrido (Webview)

Fontes, incluindo fontes de terceiros, podem ser carregadas de forma síncrona ou assíncrona. Carregamento assíncrono significa que as fontes podem ser carregadas depois que o WebdriverIO determina que uma página foi totalmente carregada. Para evitar problemas de renderização de fontes, este módulo, por padrão, aguardará que todas as fontes sejam carregadas antes de fazer uma captura de tela.

## Comparar (Check) Opções

As opções de comparação são opções que influenciam a maneira como a comparação, por [ResembleJS](https://github.com/Huddle/Resemble.js), está sendo executada.

:::info OBSERVAÇÃO

- Todas as opções de [Salvar opções](#save-options) podem ser usadas para os métodos Comparar
- Todas as opções de comparação podem ser usadas durante a instanciação do serviço **ou** para cada método de verificação. Se uma opção de método tiver a mesma chave que uma opção que foi definida durante a instanciação do serviço, a opção de comparação de método substituirá o valor da opção de comparação de serviço.
- Todas as opções podem ser usadas para:
    - Navegador
    - Aplicativo Híbrido
    - Aplicativo nativo

:::

### `ignoreAlpha`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não

Compare imagens e descarte alfa.

### `blockOutSideBar`

- **Tipo:** `boolean`
- **Padrão:** `true`
- **Obrigatório:** não
- **Observação:** _Só pode ser usado para `checkScreen()`. Isto é **somente para iPad**_

Bloqueie automaticamente a barra lateral para iPads no modo paisagem durante comparações. Isso evita falhas no componente nativo de guia/privado/favorito.

### `blockOutStatusBar`

- **Tipo:** `boolean`
- **Padrão:** `true`
- **Obrigatório:** não
- **Observação:** _Isto é **somente para dispositivos móveis**_

Bloqueie automaticamente a barra de status e endereço durante as comparações. Isso evita falhas de tempo, wifi ou status da bateria.

### `blockOutToolBar`

- **Tipo:** `boolean`
- **Padrão:** `true`
- **Obrigatório:** não
- **Observação:** _Isto é **somente para dispositivos móveis**_

Bloquear automaticamente a barra de ferramentas.

### `ignoreAntialiasing`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não

Compare imagens e descarte o anti-aliasing.

### `ignoreColors`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não

Mesmo que as imagens sejam coloridas, a comparação comparará 2 imagens em preto e branco

### `ignoreLess`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não

Compare imagens e compare com  `red = 16, green = 16, blue = 16, alpha = 16, minBrightness=16, maxBrightness=240`

### `ignoreNothing`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não

Compare imagens e compare com  `red = 0, green = 0, blue = 0, alpha = 0, minBrightness=0, maxBrightness=255`

### `rawMisMatchPercentage`

- **Tipo:** `boolean`
- **Tipo:** `booleano`
- **Obrigatório:** não

Se verdadeiro, a porcentagem de retorno será como `0,12345678`, o padrão é `0,12`

### `returnAllCompareData`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não

Isso retornará todos os dados de comparação, não apenas a porcentagem de incompatibilidade

### `saveAboveTolerance`

- **Tipo:** `número`
- **Padrão:** `0`
- **Padrão:** `0`

Valor permitido de `misMatchPercentage` que impede salvar imagens com diferenças

### `largeImageThreshold`

- **Tipo:** `número`
- **Padrão:** `0`
- **Obrigatório:** não

Comparar imagens grandes pode levar a problemas de desempenho.
Ao fornecer um número para a quantidade de pixels aqui (maior que 0), o algoritmo de comparação ignora pixels quando a largura ou altura da imagem é maior que os pixels `largeImageThreshold`.

### `scaleImagesToSameSize`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não

Dimensiona 2 imagens para o mesmo tamanho antes da execução da comparação. É altamente recomendável habilitar `ignoreAntialiasing` e `ignoreAlpha`

## Opções de pasta

A pasta de base e as pastas de captura de tela (real, diff) são opções que podem ser definidas durante a instanciação do plugin ou método. Para definir as opções de pasta em um método específico, passe as opções de pasta para o objeto de opção do método. Isso pode ser usado para:

- Navegador
- Aplicativo Híbrido
- Aplicativo nativo

```ts
import path from 'node:path'

const methodOptions = {
    actualFolder: path.join(process.cwd(), 'customActual'),
    baselineFolder: path.join(process.cwd(), 'customBaseline'),
    diffFolder: path.join(process.cwd(), 'customDiff'),
}

// You can use this for all methods
await expect(
    await browser.checkFullPageScreen("checkFullPage", methodOptions)
).toEqual(0)
```

### `actualFolder`

- **Tipo:** `string`
- **Obrigatório:** não

Pasta para o instantâneo que foi capturado no teste.

### `baselineFolder`

- **Tipo:** `string`
- **Obrigatório:** não

Pasta para a imagem de base que está sendo usada para comparação.

### `diffFolder`

- **Tipo:** `string`
- **Obrigatório:** não

Pasta para a diferença de imagem renderizada pelo ResembleJS.
