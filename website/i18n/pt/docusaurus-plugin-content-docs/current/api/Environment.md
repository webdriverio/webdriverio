---
id: environment
title: Variáveis ​​de ambiente
---

O WebdriverIO define as seguintes variáveis ​​de ambiente em cada trabalhador:

## `NODE_ENV`

Defina como `'test'` se ainda não estiver definido como outra coisa.

## `WDIO_LOG_LEVEL`

Pode ser definido como valores `trace`, `debug`, `info`, `warn`, `error`, `silent` para gravar logs com detalhes correspondentes. Tem prioridade sobre o valor `logLevel` passado.

## `WDIO_WORKER_ID`

Um ID exclusivo que ajuda a identificar o processo do trabalhador. Ele tem o formato de `{number}-{number}`, onde o primeiro número identifica a capacidade e o segundo o arquivo de especificação que a capacidade está executando, por exemplo, `0-5` indica um trabalhador que está executando o 6º arquivo de especificação para a primeira capacidade.
