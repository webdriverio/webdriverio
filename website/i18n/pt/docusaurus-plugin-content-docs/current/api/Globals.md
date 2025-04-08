---
id: globals
title: Globais
---

Nos seus arquivos de teste, o WebdriverIO coloca cada um desses métodos e objetos no ambiente global. Você não precisa importar nada para usá-los. Entretanto, se você preferir importações explícitas, você pode fazer `import { browser, $, $$, expect } from '@wdio/globals'` e definir `injectGlobals: false` na sua configuração WDIO.

Os seguintes objetos globais são definidos se não forem configurados de outra forma:

- `browser`: WebdriverIO [Objeto navegador](https://webdriver.io/docs/api/browser)
- `driver`: alias para `browser` (usado ao executar testes móveis)
- `multiremotebrowser`: alias para `browser` ou `driver`, mas definido apenas para sessões [Multiremote](/docs/multiremote)
- `$`: comando para buscar um elemento (veja mais em [documentação da API](/docs/api/browser/$))
- `$$`: comando para buscar elementos (veja mais em [documentação da API](/docs/api/browser/$$))
- `expect`: estrutura de asserção para WebdriverIO (consulte [documentação da API](/docs/api/expect-webdriverio))

__Observação:__ o WebdriverIO não tem controle sobre as estruturas usadas (por exemplo, Mocha ou Jasmine) que definem variáveis ​​globais ao inicializar seu ambiente.
