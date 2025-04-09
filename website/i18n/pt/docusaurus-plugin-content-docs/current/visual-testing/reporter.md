---
id: visual-reporter
title: Visual Reporter
---

O Visual Reporter é um novo recurso introduzido no `@wdio/visual-service`, a partir da versão [v5.2.0](https://github.com/webdriverio/visual-testing/releases/tag/%40wdio%2Fvisual-service%405.2.0). Este repórter permite que os usuários visualizem os relatórios de diferenças JSON gerados pelo serviço de teste visual e os transformem em um formato legível por humanos. Ele ajuda as equipes a analisar e gerenciar melhor os resultados dos testes visuais, fornecendo uma interface gráfica para revisar a saída.

Para utilizar esse recurso, certifique-se de ter a configuração necessária para gerar o arquivo `output.json` necessário. Este documento orientará você na configuração, execução e compreensão do Visual Reporter.

# Pré-requisitos

Antes de usar o Visual Reporter, certifique-se de ter configurado o serviço Visual Testing para gerar arquivos de relatório JSON:

```ts
export const config = {
    // ...
    services: [
        [
            "visual",
            {
                createJsonReportFiles: true, // Gera o arquivo output.json 
            },
        ],
    ],
};
```

Para obter instruções de configuração mais detalhadas, consulte a documentação de teste visual do WebdriverIO [./] ou [`createJsonReportFiles`](./service-options.md#createjsonreportfiles-new)

# Instalação

Para instalar o Visual Reporter, adicione-o como uma dependência de desenvolvimento ao seu projeto usando o npm:

```bash
npm install @wdio/visual-reporter --save-dev
```

Isso garantirá que os arquivos necessários estejam disponíveis para gerar relatórios dos seus testes visuais.

# Uso

## Construindo o Visual Report

Depois de executar seus testes visuais e eles gerarem o arquivo `output.json`, você pode criar o relatório visual usando a CLI ou prompts interativos.

### Uso CLI

Você pode usar o comando CLI para gerar o relatório executando:

```bash
npx wdio-visual-reporter --jsonOutput=<0> --reportFolder=<1> --logLevel=debug
```

#### Opções necessárias:

- `--jsonOutput`: O caminho relativo para o arquivo `output.json` gerado pelo serviço de teste visual. Este caminho é relativo ao diretório de onde você executa o comando.
- `--reportFolder`: O diretório relativo onde o relatório gerado será armazenado. Este caminho também é relativo ao diretório de onde você executa o comando.

#### Opções opcionais:

- `--logLevel`: Defina como `debug` para obter registro detalhado, especialmente útil para solução de problemas.

#### Exemplo

```bash
npx wdio-visual-reporter --jsonOutput=/path/to/output.json --reportFolder=/path/to/report --logLevel=debug
```

Isso gerará o relatório na pasta especificada e fornecerá feedback no console. Por exemplo:

```bash
✔ Saída da compilação copiada com sucesso para "/caminho/para/relatório".
⠋ Preparar recursos do relatório...
✔ Recursos do relatório gerados com sucesso.
```

#### Visualizando o relatório

:::warning
Abrir `path/to/report/index.html` diretamente em um navegador **sem servi-lo de um servidor local** **NÃO** funcionará.
:::

Para visualizar o relatório, você precisa usar um servidor simples como [sirv-cli](https://www.npmjs.com/package/sirv-cli). Você pode iniciar o servidor com o seguinte comando:

```bash
npx sirv-cli /path/to/report --single
```

Isso produzirá logs semelhantes ao exemplo abaixo. Observe que o número da porta pode variar:

```logs
  Your application is ready~! 🚀

  - Local:      http://localhost:8080
  - Network:    Add `--host` to expose

────────────────── LOGS ──────────────────
```

Agora você pode visualizar o relatório abrindo o URL fornecido no seu navegador.

### Usando prompts interativos

Como alternativa, você pode executar o seguinte comando e responder aos prompts para gerar o relatório:

```bash
npx @wdio/visual-reporter
```

Os prompts orientarão você a fornecer os caminhos e opções necessários. No final, o prompt interativo também perguntará se você deseja iniciar um servidor para visualizar o relatório. Se você optar por iniciar o servidor, a ferramenta iniciará um servidor simples e exibirá uma URL nos logs. Você pode abrir este URL no seu navegador para visualizar o relatório.

![Visual Reporter CLI](/img/visual/cli-screen-recording.gif)

![Visual Reporter](/img/visual/visual-reporter.gif)

#### Visualizando o relatório

:::warning
Abrir `path/to/report/index.html` diretamente em um navegador **sem servi-lo de um servidor local** **NÃO** funcionará.
:::

Se você optou por **não** iniciar o servidor por meio do prompt interativo, ainda poderá visualizar o relatório executando o seguinte comando manualmente:

```bash
npx sirv-cli /path/to/report --single
```

Isso produzirá logs semelhantes ao exemplo abaixo. Observe que o número da porta pode variar:

```logs
  Your application is ready~! 🚀

  - Local:      http://localhost:8080
  - Network:    Add `--host` to expose

────────────────── LOGS ──────────────────
```

Agora você pode visualizar o relatório abrindo o URL fornecido no seu navegador.

# Demonstração de relatório

Para ver um exemplo da aparência do relatório, visite nossa [demonstração do GitHub Pages](https://webdriverio.github.io/visual-testing/).

# Compreendendo o Visual Report

O Visual Reporter fornece uma visão organizada dos resultados dos seus testes visuais. Para cada teste, você poderá:

- Navegue facilmente entre os casos de teste e veja os resultados agregados.
- Revise metadados, como nomes de testes, navegadores usados ​​e resultados de comparação.
- Veja imagens diferentes mostrando onde diferenças visuais foram detectadas.

Esta representação visual simplifica a análise dos resultados dos seus testes, facilitando a identificação e o tratamento de regressões visuais.

# Integrações de CI

Estamos trabalhando para oferecer suporte a diferentes ferramentas de CI, como Jenkins, GitHub Actions e assim por diante. Se você quiser nos ajudar, entre em contato conosco no [Discord - Teste Visual](https://discord.com/channels/1097401827202445382/1186908940286574642).
