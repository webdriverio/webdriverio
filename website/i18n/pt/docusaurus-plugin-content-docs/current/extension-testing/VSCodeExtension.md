---
id: vscode-extensions
title: Teste de extensão do VS Code
---

O WebdriverIO permite que você teste perfeitamente suas extensões do [VS Code](https://code.visualstudio.com/) de ponta a ponta no VS Code Desktop IDE ou como extensão da web. Você só precisa fornecer um caminho para sua extensão e o framework faz o resto. Com o [`wdio-vscode-service`](https://www.npmjs.com/package/wdio-vscode-service) tudo é cuidado e muito mais:

- 🏗️ Instalando o VSCode (estável, insiders ou uma versão especificada)
- ⬇️ Baixando o Chromedriver específico para a versão do VSCode fornecida
- 🚀 Permite que você acesse a API do VSCode a partir dos seus testes
- 🖥️ Iniciando o VSCode com configurações de usuário personalizadas (incluindo suporte para VSCode no Ubuntu, MacOS e Windows)
- 🌐 Ou serve VSCode de um servidor para ser acessado por qualquer navegador para testar extensões da web
- 📔 Bootstrapping de objetos de página com localizadores correspondentes à sua versão do VSCode

## Começando

Para iniciar um novo projeto WebdriverIO, execute:

```sh
npm create wdio@latest ./
```

Um assistente de instalação guiará você pelo processo. Certifique-se de selecionar _"Teste de extensão do VS Code"_ quando for perguntado que tipo de teste você gostaria de fazer. Depois, mantenha os padrões ou modifique de acordo com sua preferência.

## Exemplo de configuração

Para usar o serviço, você precisa adicionar `vscode` à sua lista de serviços, opcionalmente seguido por um objeto de configuração. Isso fará com que o WebdriverIO baixe os binários do VSCode e a versão apropriada do Chromedriver:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/vscode-extension/electron.js
```

Se você definir `wdio:vscodeOptions` com qualquer outro `browserName`, exceto `vscode`, por exemplo, `chrome`, o serviço servirá a extensão como extensão da web. Se você testar no Chrome, nenhum serviço de driver adicional será necessário, por exemplo:

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/vscode-extension/chrome.js
```

_Observação:_ ao testar extensões da web, você só pode escolher entre `stable` ou `insiders` como `browserVersion`.

### Configuração do TypeScript

No seu `tsconfig.json` certifique-se de adicionar `wdio-vscode-service` à sua lista de tipos:

```json
{
    "compilerOptions": {
        "types": [
            "node",
            "webdriverio/async",
            "@wdio/mocha-framework",
            "expect-webdriverio",
            "wdio-vscode-service"
        ],
        "target": "es2020",
        "moduleResolution": "node16"
    }
}
```

## Uso

Você pode então usar o método `getWorkbench` para acessar os objetos de página para os localizadores que correspondem à versão desejada do VSCode:

```ts
describe('WDIO VSCode Service', () => {
    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toBe('[Extension Development Host] - README.md - wdio-vscode-service - Visual Studio Code')
    })
})
```

A partir daí, você pode acessar todos os objetos de página usando os métodos de objeto de página corretos. Descubra mais sobre todos os objetos de página disponíveis e seus métodos na [documentação de objetos de página](https://webdriverio-community.github.io/wdio-vscode-service/).

### Acessando APIs do VSCode

Se você quiser executar determinada automação por meio da [API do VSCode](https://code.visualstudio.com/api/references/vscode-api), poderá fazer isso executando comandos remotos por meio do comando personalizado `executeWorkbench`. Este comando permite executar remotamente o código do seu teste dentro do ambiente VSCode e permite acessar a API do VSCode. Você pode passar parâmetros arbitrários para a função, que serão então propagados para a função. O objeto `vscode` será sempre passado como primeiro argumento após os parâmetros da função externa. Observe que você não pode acessar variáveis ​​fora do escopo da função, pois o retorno de chamada é executado remotamente. Aqui está um exemplo:

```ts
const workbench = await browser.getWorkbench()
await browser.executeWorkbench((vscode, param1, param2) => {
    vscode.window.showInformationMessage(`Eu sou um ${param1} ${param2}!`)
}, 'API', 'call')

const notifs = await workbench.getNotifications()
console.log(await notifs[0].getMessage()) // exibe: "Eu sou um API call!"
```

Para obter a documentação completa do objeto, confira [docs](https://webdriverio-community.github.io/wdio-vscode-service/modules.html). Você pode encontrar vários exemplos de uso no [conjunto de testes deste projeto](https://github.com/webdriverio-community/wdio-vscode-service/blob/main/test/specs).

## Mais informações

Você pode aprender mais sobre como configurar o [`wdio-vscode-service`](https://www.npmjs.com/package/wdio-vscode-service) e como criar objetos de página personalizados nos [documentos de serviço](/docs/wdio-vscode-service). Você também pode assistir à seguinte palestra de [Christian Bromann](https://twitter.com/bromann) em [_Testando extensões complexas do VSCode com o poder dos padrões da Web_](https://www.youtube.com/watch?v=PhGNTioBUiU):

<LiteYouTubeEmbed id="PhGNTioBUiU" title="Testando extensões complexas do VSCode com o poder dos padrões da Web" />
