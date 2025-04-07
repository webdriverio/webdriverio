---
id: integrate-with-percy
title: For Web Application
---

## Para aplicação web

Antes da integração, você pode explorar o tutorial de compilação de amostra do Percy para WebdriverIO.
Integre seus testes automatizados do WebdriverIO com o BrowserStack Percy e aqui está uma visão geral das etapas de integração:

### Integre seus testes automatizados do WebdriverIO com o BrowserStack Percy e aqui está uma visão geral das etapas de integração:

Faça login no Percy. Etapa 1: Crie um projeto Percy Após a criação do projeto, Percy gera um token. Tome nota disso. Você precisa usá-lo para definir sua variável de ambiente na próxima etapa.

Para obter detalhes sobre como criar um projeto, consulte Criar um projeto Percy.

### Etapa 2: defina o token do projeto como uma variável de ambiente

Execute o comando fornecido para definir PERCY_TOKEN como uma variável de ambiente:

```sh
export PERCY_TOKEN="<0>"   // macOS or Linux
$Env:PERCY_TOKEN="<0>"   // Windows PowerShell
set PERCY_TOKEN="<0>"    // Windows CMD
```

### Etapa 3: instalar dependências do Percy

Instale os componentes necessários para estabelecer o ambiente de integração para seu conjunto de testes.

Para instalar as dependências, execute o seguinte comando:

```sh
npm install --save-dev @percy/cli @percy/webdriverio
```

### Step 4: Update your test script

Importe a biblioteca Percy para usar o método e os atributos necessários para fazer capturas de tela.
O exemplo a seguir usa a função percySnapshot() no modo assíncrono:

```sh
import percySnapshot from '@percy/webdriverio';
describe('webdriver.io page', () => {
  it('should have the right title', async () => {
    await browser.url('https://webdriver.io');
    await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js');
    await percySnapshot('webdriver.io page');
  });
});
```

Ao usar o WebdriverIO no modo autônomo, forneça o objeto do navegador como o primeiro argumento para a função `percySnapshot`:

```sh
import { remote } from 'webdriverio'

import percySnapshot from '@percy/webdriverio';

const browser = await remote({
  logLevel: 'trace',
  capabilities: {
    browserName: 'chrome'
  }
});

await browser.url('https://duckduckgo.com');
const inputElem = await browser.$('#search_form_input_homepage');
await inputElem.setValue('WebdriverIO');
const submitBtn = await browser.$('#search_button_homepage');
await submitBtn.click();
// the browser object is required in standalone mode
percySnapshot(browser, 'WebdriverIO at DuckDuckGo');
await browser.deleteSession();
```

Os argumentos do método snapshot são:

```sh
percySnapshot(name[, options])
```

### Modo autônomo

```sh
percySnapshot(browser, name[, options])
```

- browser (obrigatório) - O objeto do navegador WebdriverIO
- name (obrigatório) - O nome do instantâneo; deve ser exclusivo para cada instantâneo
- options - Veja as opções de configuração por instantâneo

Para saber mais, consulte Instantâneo do Percy.

### Etapa 5: Execute o Percy

Execute seus testes usando o comando `percy exec` conforme mostrado abaixo:

Se você não puder usar o comando `percy:exec` ou preferir executar seus testes usando as opções de execução do IDE, você pode usar os comandos `percy:exec:start` e `percy:exec:stop`. Para saber mais, visite Executar Percy.

```sh
percy exec -- wdio wdio.conf.js
```

```sh
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Running "wdio wdio.conf.js"
...
[...] webdriver.io page
[percy] Snapshot taken "webdriver.io page"
[...]    ✓ should have the right title
...
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Visite as seguintes páginas para mais detalhes:

- [Integre seus testes WebdriverIO com Percy](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- [Página de variáveis ​​de ambiente](https://www.browserstack.com/docs/percy/get-started/set-env-var/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- Integre usando o BrowserStack SDK se estiver usando o BrowserStack Automate.

| Recurso                                                                                                                                                                                  | Descrição                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [Documentos oficiais](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                 | Documentação do WebdriverIO de Percy              |
| [Exemplo de compilação - Tutorial](https://www.browserstack.com/docs/percy/sample-build/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) | Tutorial do Percy WebdriverIO                     |
| [Vídeo oficial](https://youtu.be/1Sr_h9_3MI0/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                                                        | Teste visual com Percy                            |
| [Blog](https://www.browserstack.com/blog/introducing-visual-reviews-2-0/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                             | Apresentando o Visual Reviews 2.0 |
