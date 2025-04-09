---
id: methods
title: Metódos
---

Os seguintes métodos são adicionados ao objeto global WebdriverIO [`browser`](/docs/api/browser).

## Salvar métodos

:::info DICA
Use os Métodos de Salvar somente quando você **não** quiser comparar telas, mas quiser apenas ter um elemento/captura de tela.
:::

### `saveElement`

Salva uma imagem de um elemento.

#### Uso

```ts
await browser.saveElement(
    // element
    await $('#element-selector'),
    // tag
    'your-reference',
    // saveElementOptions
    {
        // ...
    }
);
```

#### Suporta

- Navegadores para Desktop
- Navegadores para celular
- Aplicativos híbridos para celular
- Aplicativos nativos

#### Parâmetros

- **`element`:**
 - **Obrigatório:** Sim
 - **Tipo:** Elemento WebdriverIO
- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`saveElementOptions`:**
 - **Obrigatório:** Não
 - **Type:** um objeto de opções, veja [Salvar opções](./method-options#save-options)

#### Saida:

Veja a página [Saída de teste](./test-output#savescreenelementfullpagescreen).

### `saveScreen`

Saves an image of a viewport.

#### Uso:

```ts
await browser.saveScreen(
    // tag
    'your-reference',
    // saveScreenOptions
    {
        // ...
    }
);
```

#### Suporta

- Navegadores para Desktop
- Navegadores para Mobile
- Aplicativos híbridos para celular
- Aplicativos nativos para celular

#### Parâmetros

- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`saveScreenOptions`:**
 - **Obrigatório:** Não
 - **Tipo:** um objeto de opções, veja [Salvar opções](./method-options#save-options)

#### Saida

Veja a página [Saída de teste](./test-output#savescreenelementfullpagescreen).

### `saveFullPageScreen`

#### Uso

Salva uma imagem da tela completa.

```ts
await browser.saveFullPageScreen(
    // tag
    'your-reference',
    // saveFullPageScreenOptions
    {
        // ...
    }
);
```

#### Support

- Navegadores de desktop
- Navegadores Mobile

#### Parameters

- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`saveFullPageScreenOptions`:**
 - **Obrigatório:** Não
 - **Tipo:** um objeto de opções, veja [Salvar opções](./method-options#save-options)

#### Saída:

Veja a página [Saída de teste](./test-output#savescreenelementfullpagescreen).

### `saveTabbablePage`

Salva uma imagem da tela completa com as linhas e pontos tabuláveis.

#### Uso

```ts
await browser.saveTabbablePage(
    // tag
    'your-reference',
    // saveTabbableOptions
    {
        // ...
    }
);
```

#### Suporta

- Navegadores de desktop

#### Parâmetros

- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`saveTabbableOptions`:**
 - **Obrigatório:** Não
 - **Tipo:** um objeto de opções, veja [Salvar opções](./method-options#save-options)

#### Saída:

Veja a página [Saída de teste](./test-output#savescreenelementfullpagescreen).

## Métodos de verificação

:::info DICA

```shell
########################################################################################
Imagem de base não encontrada. Salve a imagem atual manualmente na base.
A imagem pode ser encontrada aqui:
/Users/wswebcreation/project/.tmp/actual/desktop_chrome/examplePage-chrome-latest-1366x768.png
Se você quiser que o módulo salve automaticamente uma imagem inexistente na base,
você pode especificar 'autoSaveBaseline: true' nas opções.
##############################################################
```

:::

### `checkElement`

Compare uma imagem de um elemento com uma imagem de base.

#### Uso

```ts
await browser.checkElement(
    // element
    '#element-selector',
    // tag
    'your-reference',
    // checkElementOptions
    {
        // ...
    }
);
```

#### Suporta

- Navegadores de desktop
- Navegadores Mobiles
- Aplicativos híbridos para celular
- Aplicativos nativos para celular

#### Parâmetros

- **`element`:**
 - **Obrigatório:** Sim
 - **Tipo:** Elemento WebdriverIO
- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`checkElementOptions`:**
 - **Obrigatório:** Não
 - **Tipo:** um objeto de opções, veja [Comparar/Verificar Opções](./method-options#compare-check-options)

#### Saída:

Veja a página [Saída de teste](./test-output#checkscreenelementfullpagescreen).

### `checkScreen`

Compara uma imagem de uma janela de visualização com uma imagem de base.

#### Uso

```ts
await browser.checkScreen(
    // tag
    'your-reference',
    // checkScreenOptions
    {
        // ...
    }
);
```

#### Suporta

- Navegadores de desktop
- Navegadores Mobile
- Aplicativos híbridos para celular
- Aplicativos nativos para celular

#### Parâmetros

- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`checkScreenOptions`:**
 - **Obrigatório:** Não
 - **Tipo:** um objeto de opções, veja [Comparar/Verificar Opções](./method-options#compare-check-options)

#### Saída:

Veja a página [Saída de teste](./test-output#checkscreenelementfullpagescreen).

### `checkFullPageScreen`

Compara uma imagem da tela completa com uma imagem de base.

#### Uso

```ts
await browser.checkFullPageScreen(
    // tag
    'your-reference',
    // checkFullPageOptions
    {
        // ...
    }
);
```

#### Suporta

- Navegadores de desktop
- Navegadores Mobile

#### Parâmetros

- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`checkFullPageOptions`:**
 - **Obrigatório:** Não
 - **Tipo:** um objeto de opções, veja [Comparar/Verificar Opções](./method-options#compare-check-options)

#### Saída

Veja a página [Saída de teste](./test-output#checkscreenelementfullpagescreen).

### `checkTabbablePage`

Compara uma imagem da tela completa com as linhas e pontos tabuláveis ​​com uma imagem de base.

#### Uso

```ts
await browser.checkTabbablePage(
    // tag
    'your-reference',
    // checkTabbableOptions
    {
        // ...
    }
);
```

#### Suporta

- Navegadores de desktop

#### Parâmetros

- **`tag`:**
 - **Obrigatório:** Sim
 - **Tipo:** string
- **`checkTabbableOptions`:**
 - **Obrigatório:** Não
 - **Tipo:** um objeto de opções, veja [Comparar/Verificar Opções](./method-options#compare-check-options)

#### Saída:

Veja a página [Saída de teste](./test-output#checkscreenelementfullpagescreen).
