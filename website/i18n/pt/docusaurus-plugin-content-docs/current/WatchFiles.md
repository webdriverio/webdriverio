---
id: watcher
title: Monitorar Arquivos de Teste
---

Com o testrunner WDIO você pode monitorar os arquivos enquanto está trabalhando neles. Eles são automaticamente reexecutados se você alterar alguma coisa no seu app ou em seus arquivos de teste. Adicionando um sinalizador `--watch` ao chamar o comando `wdio` , o testrunner aguardará pela alteração de arquivos depois que tenha executado todos os testes, ex.:

```sh
wdio wdio.conf.js --watch
```

Por padrão, ele só monitora as alterações nos seus arquivos `especificações`. Contudo, definindo uma propriedade `filesToWatch` no seu `wdio.conf.js` que contém uma lista de caminhos de arquivos (globbing é suportado), também vai monitorar a que esses arquivos sejam alterados para executar a suite completa. Isso é útil se você quiser repetir automaticamente todos os seus testes se você mudar o código do seu aplicativo, por exemplo,

```js
// wdio.conf.js
export const config = {
    // ...
    filesToWatch: [
        // watch for all JS files in my app
        './src/app/**/*.js'
    ],
    // ...
}
```

:::info
Tente executar testes em paralelo o máximo possível. Os testes E2E são, por natureza, lentos. Refazer testes é útil só se você consegue manter o tempo de execução de testes individuais curto. A fim de economizar tempo, o testrunner mantém as sessões do WebDriver vivas enquanto aguarda a alteração de arquivos. Certifique-se de que seu backend do WebDriver pode ser modificado para que não feche automaticamente a sessão se nenhum comando for executado após algum tempo.
:::
