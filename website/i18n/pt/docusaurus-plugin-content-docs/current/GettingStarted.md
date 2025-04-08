---
id: gettingstarted
title: Começando
---

Bem-vindo à documentação do WebdriverIO. Isso ajudará você a começar rapidamente. Se você tiver problemas, poderá encontrar ajuda e respostas em nosso [Servidor de Suporte do Discord](https://discord.webdriver.io) ou pode entrar em contato comigo no [Twitter](https://twitter.com/webdriverio).

:::info
Estas são as documentações para a versão mais recente (__>=9.x__) do WebdriverIO. If you are still using an older version, please visit the [old documentation websites](/versions)!
:::

<LiteYouTubeEmbed id="rA4IFNyW54c" title="Introdução ao WebdriverIO" />

:::dica Canal Oficial do YouTube 🎥

Você pode encontrar mais vídeos sobre o WebdriverIO no [canal oficial do YouTube](https://youtube.com/@webdriverio). Não deixe de se inscrever!

:::

## Iniciar uma configuração do WebdriverIO

Para adicionar uma configuração completa do WebdriverIO a um projeto existente ou novo usando o [WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio), execute:

Se você estiver no diretório raiz de um projeto existente, execute:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 {label: 'bun', value: 'bun'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio@latest .
```

or if you want to create a new project:

```sh
npm init wdio@latest ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```

or if you want to create a new project:

```sh
yarn create wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio@latest .
```

ou se você quiser criar um novo projeto:

```sh
pnpm create wdio@latest ./path/to/new/project
```

</TabItem>
<TabItem value="bun">

```sh
bun create wdio@latest .
```

ou se você quiser criar um novo projeto:

```sh
bun create wdio@latest ./path/to/new/project
```

</TabItem>
</Tabs>

Este único comando baixa a ferramenta WebdriverIO CLI e executa um assistente de configuração que ajuda você a configurar seu conjunto de testes.

<CreateProjectAnimation />

O assistente solicitará um conjunto de perguntas que o orientarão durante a configuração. Você pode passar um parâmetro `--yes` para escolher uma configuração padrão que usará o Mocha com o Chrome usando o padrão [Objeto de Página](https://martinfowler.com/bliki/PageObject.html).

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 {label: 'bun', value: 'bun'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio@latest . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio@latest . --yes
```

</TabItem>
<TabItem value="bun">

```sh
bun create wdio@latest . --yes
```

</TabItem>
</Tabs>

## Instalar CLI manualmente

Você também pode adicionar o pacote CLI ao seu projeto manualmente via:

```sh
npm i --save-dev @wdio/cli
npx wdio --version # prints e.g. `8.13.10`

# executar assistente de configuração
npx wdio config
```

## Executar teste

Você pode iniciar seu conjunto de testes usando o comando `run` e apontando para a configuração do WebdriverIO que você acabou de criar:

```sh
npx wdio run ./wdio.conf.js
```

Se você quiser executar arquivos de teste específicos, você pode adicionar um parâmetro `--spec`:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

ou defina suítes em seu arquivo de configuração e execute apenas os arquivos de teste definidos em uma suíte:

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## Executar em um script

Se você quiser usar o WebdriverIO como um mecanismo de automação no [Modo Autônomo](/docs/setuptypes#standalone-mode) dentro de um script Node.JS, você também pode instalar o WebdriverIO diretamente e usá-lo como um pacote, por exemplo, para gerar uma captura de tela de um site:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__Observação:__ todos os comandos WebdriverIO são assíncronos e precisam ser manipulados corretamente usando [`async/await`](https://javascript.info/async-await).

## Testes de registro

O WebdriverIO fornece ferramentas para ajudar você a começar gravando suas ações de teste na tela e gerando scripts de teste do WebdriverIO automaticamente. Consulte [Testes do gravador com o Chrome DevTools Recorder](/docs/record) para obter mais informações.

## Requisitos do sistema

Você precisará do [Node.js](http://nodejs.org) instalado.

- Instale pelo menos a versão 18.20.0 ou superior, pois esta é a versão LTS ativa mais antiga
- Somente lançamentos que são ou se tornarão um lançamento LTS são oficialmente suportados

Se o Node não estiver instalado no seu sistema, sugerimos utilizar uma ferramenta como [NVM](https://github.com/creationix/nvm) ou [Volta](https://volta.sh/) para ajudar no gerenciamento de várias versões ativas do Node.js. NVM é uma escolha popular, enquanto Volta também é uma boa alternativa.
