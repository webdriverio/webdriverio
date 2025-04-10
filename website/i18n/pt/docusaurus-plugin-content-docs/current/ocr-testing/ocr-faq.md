---
id: ocr-faq
title: Perguntas frequentes
---

## Meus testes são muito lentos

Ao usar este `@wdio/ocr-service`, você não o usa para acelerar seus testes, você o usa porque tem dificuldade em localizar elementos em seu aplicativo web/móvel e quer uma maneira mais fácil de localizá-los. E todos nós sabemos que quando você quer algo, você perde outra coisa. **Mas....**, há uma maneira de fazer o `@wdio/ocr-service` executar mais rápido que o normal. Mais informações sobre isso podem ser encontradas [aqui](./more-test-optimization).

## Posso usar os comandos deste serviço com os comandos/seletores padrão do WebdriverIO?

Sim, você pode combinar os comandos para tornar seu script ainda mais poderoso! O conselho é usar os comandos/seletores padrão do WebdriverIO sempre que possível e usar este serviço somente quando não conseguir encontrar um seletor exclusivo, ou seu seletor ficará muito frágil.

## Meu texto não foi encontrado, como isso é possível?

Primeiro, é importante entender como o processo de OCR neste módulo funciona, então leia [esta](./ocr-testing) página. Se ainda não conseguir encontrar seu texto, tente o seguinte.

### A área da imagem é muito grande

Quando o módulo precisa processar uma grande área da captura de tela, ele pode não encontrar o texto. Você pode fornecer uma área menor fornecendo um palheiro ao usar um comando. Verifique os [comandos](./ocr-click-on-text) que oferecem suporte ao fornecimento de um palheiro.

### O contraste entre o texto e o fundo não está correto

Isso significa que você pode ter texto claro em um fundo branco ou texto escuro em um fundo escuro. Isso pode fazer com que não seja possível encontrar o texto. Nos exemplos abaixo, você pode ver que o texto `Por que WebdriverIO?` é branco e cercado por um botão cinza. Nesse caso, o texto `Por que WebdriverIO?` não será encontrado. Ao aumentar o contraste para o comando específico, ele encontra o texto e pode clicar nele, veja a segunda imagem.

```js
await driver.ocrClickOnText({
haystack: { height: 44, width: 1108, x: 129, y: 590 },
text: "WebdriverIO?",
// // Com o contraste padrão de 0,25, o texto não é encontrado
contrast: 1,
});
```

![Problemas de contraste](/img/ocr/increased-contrast.jpg)

## Por que meu elemento está sendo clicado, mas o teclado em meus dispositivos móveis nunca aparece?

Isso pode acontecer em alguns campos de texto onde o clique é determinado como muito longo e considerado um toque longo. Você pode usar a opção `clickDuration` em [`ocrClickOnText`](./ocr-click-on-text) e [`ocrSetValue`](./ocr-set-value) para aliviar isso. Veja [aqui](./ocr-click-on-text#options).

## Este módulo pode fornecer vários elementos de volta como o WebdriveIO normalmente faz?

Não, isso não é possível no momento. Se o módulo encontrar vários elementos que correspondam ao seletor fornecido, ele encontrará automaticamente o elemento que tiver a maior pontuação de correspondência.

## Posso automatizar totalmente meu aplicativo com os comandos OCR fornecidos por este serviço?

Nunca fiz isso, mas, em teoria, deveria ser possível. Por favor, nos avise se você conseguiu ☺️.

## Vejo um arquivo extra chamado `{languageCode}.traineddata` sendo adicionado. O que é isso?

`{languageCode}.traineddata` é um arquivo de dados de idioma usado pelo Tesseract. Ele contém os dados de treinamento para o idioma selecionado, o que inclui as informações necessárias para que o Tesseract reconheça caracteres e palavras em inglês de forma eficaz.

### Conteúdo de `{languageCode}.traineddata`

O arquivo geralmente contém:

1. **Dados do conjunto de caracteres:** informações sobre os caracteres do idioma inglês.
2. **Modelo de linguagem:** Um modelo estatístico de como os caracteres formam palavras e as palavras formam frases.
3. **Extratores de recursos:** Dados sobre como extrair recursos de imagens para o reconhecimento de caracteres.
4. **Dados de treinamento:** Dados derivados do treinamento do Tesseract em um grande conjunto de imagens de texto em inglês.

### Por que o `{languageCode}.traineddata` é importante?

1. **Reconhecimento de idioma:** O Tesseract depende desses arquivos de dados treinados para reconhecer e processar com precisão texto em um idioma específico. Sem `{languageCode}.traineddata`, o Tesseract não seria capaz de reconhecer texto em inglês.
2. **Desempenho:** A qualidade e a precisão do OCR estão diretamente relacionadas à qualidade dos dados de treinamento. Usar o arquivo de dados treinado correto garante que o processo de OCR seja o mais preciso possível.
3. **Compatibilidade:** garantir que o arquivo `{languageCode}.traineddata` esteja incluído no seu projeto, facilitando a replicação do ambiente de OCR em diferentes sistemas ou máquinas de membros da equipe.

### Controle de versão `{languageCode}.traineddata`

Incluir `{languageCode}.traineddata` no seu sistema de controle de versão é recomendado pelos seguintes motivos:

1. **Consistência:** garante que todos os membros da equipe ou ambientes de implantação usem exatamente a mesma versão dos dados de treinamento, levando a resultados de OCR consistentes em diferentes ambientes.
2. **Reprodutibilidade:** armazenar este arquivo no controle de versão facilita a reprodução dos resultados ao executar o processo de OCR posteriormente ou em uma máquina diferente.
3. **Gerenciamento de Dependências:** Incluí-lo no sistema de controle de versão ajuda a gerenciar dependências e garante que qualquer configuração ou ambiente inclua os arquivos necessários para que o projeto seja executado corretamente.

## Existe uma maneira fácil de ver qual texto é encontrado na minha tela sem executar um teste?

Sim, você pode usar nosso assistente CLI para isso. A documentação pode ser encontrada [aqui](./cli-wizard)
