---
id: coverage
title: Cobertura
---

O executor de navegador do WebdriverIO oferece suporte a relatórios de cobertura de código usando [`istanbul`](https://istanbul.js.org/). O testrunner instrumentará automaticamente seu código e capturará a cobertura de código para você.

## Configurar

Para habilitar o relatório de cobertura de código, habilite-o por meio da configuração do executor do navegador WebdriverIO, por exemplo:

```js title=wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        coverage: {
            enabled: true
        }
    }],
    // ...
}
```

Confira todas as [opções de cobertura](/docs/runner#coverage-options) para saber como configurá-las corretamente.

## Ignorando o código

Pode haver algumas seções da sua base de código que você deseja excluir propositalmente do rastreamento de cobertura. Para fazer isso, você pode usar as seguintes dicas de análise:

- `/* istanbul ignore if */`: ignore a próxima instrução if.
- `/* istanbul ignore else */`: ignore a parte else de uma instrução if.
- `/* istanbul ignore next */`: ignore a próxima coisa no código-fonte (funções, instruções if, classes, o que você quiser).
- `/* arquivo de ignorar istambul */`: ignorar um arquivo de origem inteiro (isso deve ser colocado no topo do arquivo).

:::info

É recomendável excluir seus arquivos de teste do relatório de cobertura, pois isso pode causar erros, por exemplo, ao chamar os comandos `execute` ou `executeAsync`. Se você quiser mantê-los em seu relatório, certifique-se de excluí-los instrumentando-os por meio de:

```ts
await browser.execute(/* istanbul ignore next */() => {
    // ...
})
```

:::
