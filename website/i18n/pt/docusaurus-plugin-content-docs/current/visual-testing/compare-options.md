---
id: compare-options
title: Comparar opções
---

As opções de comparação são opções que influenciam a maneira como a comparação, por [ResembleJS](https://github.com/Huddle/Resemble.js), está sendo executada.

:::info OBSERVAÇÃO
Todas as opções de comparação podem ser usadas durante a instanciação do serviço ou para cada `checkElement`, `checkScreen` e `checkFullPageScreen`. Se uma opção de método tiver a mesma chave que uma opção que foi definida durante a instanciação do serviço, a opção de comparação de método substituirá o valor da opção de comparação de serviço.
:::

### `ignoreAlpha`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Compare imagens e descarte alfa.

### `blockOutSideBar`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Só pode ser usado para `checkScreen()`. Ele substituirá a configuração do plugin. Isto é **somente para iPad**_

Bloqueie automaticamente a barra lateral para iPads no modo paisagem durante comparações. Isso evita falhas no componente nativo de guia/privado/favorito.

### `blockOutStatusBar`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin. Isto é **Somente para dispositivos móveis**_

Bloqueie automaticamente a barra de status e endereço durante as comparações. Isso evita falhas de tempo, wifi ou status da bateria.

### `blockOutToolBar`

- **Tipo:** `boolean`
- **Padrão:** `falso`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin. Isto é **Somente para dispositivos móveis**_

Bloquear automaticamente a barra de ferramentas.

### `ignoreAntialiasing`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Compare imagens e descarte o anti-aliasing.

### `ignoreColors`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Mesmo que as imagens sejam coloridas, a comparação comparará 2 imagens em preto e branco

### `ignoreLess`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Compare imagens e compare com `red = 16, green = 16, blue = 16, alpha = 16, minBrightness=16, maxBrightness=240`

### `ignoreNothing`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Compare imagens e compare com `red = 0, green = 0, blue = 0, alpha = 0, minBrightness=0, maxBrightness=255`

### `ignoreTransparentPixel`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Padrão:** `false`
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Compare as imagens e ele irá ignorar todos os pixels que tenham alguma transparência em uma das imagens

### `rawMisMatchPercentage`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Se verdadeiro, a porcentagem de retorno será como `0,12345678`, o padrão é `0,12`

### `returnAllCompareData`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Padrão:** `false`
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Isso retornará todos os dados de comparação, não apenas a porcentagem de incompatibilidade

### `saveAboveTolerance`

- **Tipo:** `número`
- **Padrão:** `0`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Valor permitido de `misMatchPercentage` que impede salvar imagens com diferenças

### `largeImageThreshold`

- **Tipo:** `número`
- **Padrão:** `0`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Comparar imagens grandes pode levar a problemas de desempenho.
Ao fornecer um número para a quantidade de pixels aqui (maior que 0), o algoritmo de comparação ignora pixels quando a largura ou altura da imagem é maior que os pixels `largeImageThreshold`.

### `scaleImagesToSameSize`

- **Tipo:** `boolean`
- **Padrão:** `false`
- **Obrigatório:** não
- **Observação:** _Também pode ser usado para `checkElement`, `checkScreen()` e `checkFullPageScreen()`. Ele substituirá a configuração do plugin_

Dimensiona 2 imagens para o mesmo tamanho antes da execução da comparação. É altamente recomendável habilitar `ignoreAntialiasing` e `ignoreAlpha`
