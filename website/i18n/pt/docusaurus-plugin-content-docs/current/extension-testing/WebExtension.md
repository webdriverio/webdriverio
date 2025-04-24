---
id: web-extensions
title: Teste de extensão da web
---

WebdriverIO é a ferramenta ideal para automatizar um navegador. As extensões da Web fazem parte do navegador e podem ser automatizadas da mesma maneira. Sempre que sua extensão da web usar scripts de conteúdo para executar JavaScript em sites ou oferecer um modal pop-up, você pode executar um teste e2e para isso usando o WebdriverIO.

## Carregando uma extensão da Web no navegador

Como primeiro passo, temos que carregar a extensão em teste no navegador como parte da nossa sessão. Isso funciona de forma diferente no Chrome e no Firefox.

:::info

Esses documentos deixam de fora as extensões web do Safari, pois seu suporte é muito inferior e a demanda dos usuários não é alta. Se você estiver criando uma extensão web para o Safari, [abra um problema](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) e colabore para incluí-lo aqui também.

:::

### Chrome

É possível carregar uma extensão da web no Chrome fornecendo uma string codificada em `base64` do arquivo `crx` ou fornecendo um caminho para a pasta da extensão da web. O mais fácil é fazer o último definindo seus recursos do Chrome da seguinte forma:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/web-extension/chrome.js
```

:::info

Se você automatizar um navegador diferente do Chrome, por exemplo, Brave, Edge ou Opera, é provável que a opção do navegador corresponda ao exemplo acima, apenas usando um nome de recurso diferente, por exemplo, `ms:edgeOptions`.

:::

Se você compilar sua extensão como um arquivo `.crx` usando, por exemplo, o pacote NPM [crx](https://www.npmjs.com/package/crx), você também pode injetar a extensão empacotada via:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/web-extension/crx.js
```

### Firefox

Para criar um perfil do Firefox que inclua extensões, você pode usar o [Serviço de Perfil do Firefox](/docs/firefox-profile-service) para configurar sua sessão adequadamente. No entanto, você pode ter problemas em que sua extensão desenvolvida localmente não pode ser carregada devido a problemas de assinatura. Neste caso, você também pode carregar uma extensão no gancho `before` por meio do comando [`installAddOn`](/docs/api/gecko#installaddon), por exemplo:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/web-extension/firefox.js
```

Para gerar um arquivo `.xpi`, é recomendável usar o pacote NPM [`web-ext`](https://www.npmjs.com/package/web-ext). Você pode agrupar sua extensão usando o seguinte comando de exemplo:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```

## Dicas e truques

A seção a seguir contém um conjunto de dicas e truques úteis que podem ser úteis ao testar uma extensão da web.

### Testar Modal Popup no Chrome

Se você definir uma entrada de ação do navegador `default_popup` no seu [manifesto de extensão](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action), você poderá testar essa página HTML diretamente, já que clicar no ícone da extensão na barra superior do navegador não funcionará. Em vez disso, você precisa abrir o arquivo html pop-up diretamente.

No Chrome, isso funciona recuperando o ID da extensão e abrindo a página pop-up por meio de `browser.url('...')`. O comportamento nessa página será o mesmo do pop-up. Para fazer isso, recomendamos escrever o seguinte comando personalizado:

```ts customCommand.ts
export async function openExtensionPopup (this: WebdriverIO.Browser, extensionName: string, popupUrl = 'index.html') {
  if ((this.capabilities as WebdriverIO.Capabilities).browserName !== 'chrome') {
    throw new Error('This command only works with Chrome')
  }
  await this.url('chrome://extensions/')

  const extensions = await this.$$('extensions-item')
  const extension = await extensions.find(async (ext) => (
    await ext.$('#name').getText()) === extensionName
  )

  if (!extension) {
    const installedExtensions = await extensions.map((ext) => ext.$('#name').getText())
    throw new Error(`Couldn't find extension "${extensionName}", available installed extensions are "${installedExtensions.join('", "')}"`)
  }

  const extId = await extension.getAttribute('id')
  await this.url(`chrome-extension://${extId}/popup/${popupUrl}`)
}

declare global {
  namespace WebdriverIO {
      interface Browser {
        openExtensionPopup: typeof openExtensionPopup
      }
  }
}
```

No seu `wdio.conf.js` você pode importar este arquivo e registrar o comando personalizado no seu gancho `before`, por exemplo:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/popup-modal.js
```

Agora, no seu teste, você pode acessar a página pop-up via:

```ts
await browser.openExtensionPopup('My Web Extension')
```
