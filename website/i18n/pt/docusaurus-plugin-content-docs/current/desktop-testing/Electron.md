---
id: electron
title: Electron
---

Electron é uma estrutura para criar aplicativos de desktop usando JavaScript, HTML e CSS. Ao incorporar o Chromium e o Node.js em seu binário, o Electron permite que você mantenha uma base de código JavaScript e crie aplicativos multiplataforma que funcionam no Windows, macOS e Linux — nenhuma experiência nativa de desenvolvimento é necessária.

O WebdriverIO fornece um serviço integrado que simplifica a interação com seu aplicativo Electron e torna seus testes muito simples. As vantagens de usar o WebdriverIO para testar aplicativos Electron são:

- 🚗 configuração automática do Chromedriver necessário
- 📦 detecção automática de caminho do seu aplicativo Electron - suporta [Electron Forge](https://www.electronforge.io/) e [Electron Builder](https://www.electron.build/)
- 🧩 acesse as APIs do Electron dentro dos seus testes
- 🧩 acesse as APIs do Electron dentro dos seus testes

Você só precisa de alguns passos simples para começar. Assista a este tutorial em vídeo simples passo a passo de introdução no canal [WebdriverIO no YouTube](https://www.youtube.com/@webdriverio):

<LiteYouTubeEmbed id="iQNxTdWedk0" title="Introdução aos testes do ElectronJS no WebdriverIO" />

Ou siga o guia na seção a seguir.

## Começando

Para iniciar um novo projeto WebdriverIO, execute:

```sh
npm create wdio@latest ./
```

Um assistente de instalação guiará você pelo processo. Certifique-se de selecionar _"Teste de Desktop - de Aplicativos Electron"_ quando for perguntado que tipo de teste você gostaria de fazer. Depois, forneça o caminho para seu aplicativo Electron compilado, por exemplo, `./dist`, e mantenha os padrões ou modifique de acordo com sua preferência.

O assistente de configuração instalará todos os pacotes necessários e criará um `wdio.conf.js` ou `wdio.conf.ts` com a configuração necessária para testar seu aplicativo. Se você concordar em gerar automaticamente alguns arquivos de teste, poderá executar seu primeiro teste via `npm run wdio`.

## Configuração manual

Se você já estiver usando o WebdriverIO em seu projeto, poderá pular o assistente de instalação e apenas adicionar as seguintes dependências:

```sh
npm install --save-dev wdio-electron-service
```

Então você pode usar a seguinte configuração:

```ts
// wdio.conf.ts
exportar configuração const: WebdriverIO.Config = {
// ...
    services: [['electron', {
        appEntryPoint: './path/to/bundled/electron/main.bundle.js',
        appArgs: [/** ... */],
    }]]
}
```

É isso aí 🎉

Saiba mais sobre como [configurar o Electron Service](/docs/desktop-testing/electron/configuration), [como simular APIs do Electron](/docs/desktop-testing/electron/mocking) e [como acessar APIs do Electron](/docs/desktop-testing/electron/api).
