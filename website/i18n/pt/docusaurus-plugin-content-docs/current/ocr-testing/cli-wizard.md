---
id: cli-wizard
title: CLI Wizard
---

Você pode validar qual texto pode ser encontrado em uma imagem sem executar um teste usando o Assistente OCR CLI. As únicas coisas necessárias são:

- you have installed the `@wdio/ocr-service` as a dependency, see [Getting Started](./getting-started)
- uma imagem que você deseja processar

Em seguida, execute o seguinte comando para iniciar o assistente

```sh
npx ocr-service
```

Isso iniciará um assistente que o guiará pelas etapas para selecionar uma imagem e usar o modo haystack plus avançado. As seguintes perguntas são feitas

## Como você gostaria de especificar o arquivo?

As seguintes opções podem ser selecionadas

- Use um "explorador de arquivos"
- Digite o caminho do arquivo manualmente

### Use um "explorador de arquivos"

O assistente CLI fornece uma opção para usar um "explorador de arquivos" para procurar arquivos no seu sistema. Ele começa na pasta em que você chama o comando. Após selecionar uma imagem (use as setas do teclado e a tecla ENTER) você prosseguirá para a próxima pergunta

### Digite o caminho do arquivo manualmente

Este é um caminho direto para um arquivo em algum lugar na sua máquina local

### Você gostaria de usar um palheiro?

Aqui você tem a opção de selecionar uma área que precisa ser processada. Isso pode acelerar o processo ou reduzir/limitar a quantidade de texto que o mecanismo de OCR pode encontrar. Você precisa fornecer dados `x`, `y`, `largura`, `altura` com base nas seguintes perguntas:

- Insira a coordenada x:
- Insira a coordenada y:
- Insira a largura:
- Insira a altura:

## Você quer usar o modo avançado?

O modo avançado terá recursos extras como:

- definindo o contraste
- mais a seguir no futuro

## Demonstração

Aqui está uma demonstração

<video controls width="100%">
  <source src="/img/ocr/ocr-service-cli.mp4" />
</video>
