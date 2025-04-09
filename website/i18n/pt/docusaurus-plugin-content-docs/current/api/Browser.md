---
id: browser
title: O objeto do navegador
---

__Estende:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

O objeto do navegador é a instância de sessão que você usa para controlar o navegador ou o dispositivo móvel. Se você usar o executor de teste WDIO, poderá acessar a instância do WebDriver por meio do objeto `browser` ou `driver` global ou importá-lo usando [`@wdio/globals`](/docs/api/globals). Se você usar o WebdriverIO no modo autônomo, o objeto do navegador será retornado pelo método [`remote`](/docs/api/modules#remoteoptions-modifier).

A sessão é inicializada pelo executor de teste. O mesmo vale para encerrar a sessão. Isso também é feito pelo processo do executor de testes.

## Propriedades

Um objeto de navegador tem as seguintes propriedades:

| Nome                      | Tipo       | Detalhes                                                                                                                                                                                                                                                             |
| ------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Capacidades`             | `Objeto`   | Capacidades atribuídas do servidor remoto.<br /><b>Exemplo:</b><pre>\{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: \{<br />    chromedriverVersion: '105.0.5195.52',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  \},<br />  'goog:chromeOptions': \{ debuggerAddress: 'localhost:64679' \},<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: \{},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: \{ implicit: 0, pageLoad: 300000, script: 30000 \},<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />\}</pre>                                                                                                                                                             |
| `Capacidades Solicitadas` | `Objeto`   | Capacidades solicitadas do servidor remoto.<br /><b>Exemplo:</b><pre>\{ browserName: 'chrome' \}</pre>                                                                                                                                                            |
| `sessionId`               | `String`   | ID de sessão atribuído pelo servidor remoto.                                                                                                                                                                                                                         |
| `options`                 | `Object`   | [opções](/docs/configuration) do WebdriverIO dependendo de como o objeto do navegador foi criado. Veja mais [tipos de configuração](/docs/setuptypes).                                                                                                               |
| `commandList`             | `String[]` | Uma lista de comandos registrados na instância do navegador                                                                                                                                                                                                          |
| `isW3C`                   | `Boolean`  | Indica se esta é uma sessão W3C                                                                                                                                                                                                                                      |
| `isChrome`                | `Boolean`  | Indica se esta instância do Chrome                                                                                                                                                                                                                                   |
| `isFirefox`               | `Boolean`  | Indica se esta instância do Firefox                                                                                                                                                                                                                                  |
| `isBidi`                  | `Boolean`  | Indica se esta sessão usa Bidi                                                                                                                                                                                                                                       |
| `isSauce`                 | `Boolean`  | Indica se esta sessão está em execução no Sauce Labs                                                                                                                                                                                                                 |
| `isMacApp`                | `Boolean`  | Indica se esta sessão está em execução para um aplicativo Mac nativo                                                                                                                                                                                                 |
| `isWindowsApp`            | `Boolean`  | Indica se esta sessão está em execução para um aplicativo nativo do Windows                                                                                                                                                                                          |
| `isMobile`                | `Boolean`  | Indica uma sessão móvel. Veja mais em [Mobile Flags](#mobile-flags).                                                                                                                                                                                                 |
| `isIOS`                   | `Boolean`  | Indica uma sessão iOS. Veja mais em [Mobile Flags](#mobile-flags).                                                                                                                                                                                                   |
| `isAndroid`               | `Boolean`  | Indica uma sessão do Android. Veja mais em [Mobile Flags](#mobile-flags).                                                                                                                                                                                            |
| `isNativeContext`         | `Boolean`  | Indica se o celular está no contexto `NATIVE_APP`. Veja mais em [Mobile Flags](#mobile-flags).                                                                                                                                                                       |
| `mobileContext`           | `string`   | O fornecerá o contexto **atual** em que o driver está, por exemplo `NATIVE_APP`, `WEBVIEW_<packageName>` para Android ou `WEBVIEW_<pid>` para iOS. Isso salvará um WebDriver extra em `driver.getContext()`. Veja mais em [Mobile Flags](#mobile-flags). |


## Metódos

Com base no backend de automação usado para sua sessão, o WebdriverIO identifica quais [Comandos de Protocolo](/docs/api/protocols) serão anexados ao [objeto do navegador](/docs/api/browser). Por exemplo, se você executar uma sessão automatizada no Chrome, terá acesso a comandos específicos do Chromium, como [`elementHover`](/docs/api/chromium#elementhover), mas não a nenhum dos [comandos do Appium](/docs/api/appium).

Além disso, o WebdriverIO fornece um conjunto de métodos convenientes que são recomendados para interagir com o [navegador](/docs/api/browser) ou [elementos](/docs/api/element) na página.

Além disso, os seguintes comandos estão disponíveis:

| Nome                 | Parâmetros                                                                                                             | Detalhes                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Permite definir comandos personalizados que podem ser chamados a partir do objeto do navegador para fins de composição. Leia mais no guia [Comando personalizado](/docs/customcommands).                                                       |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | Permite substituir qualquer comando do navegador com funcionalidade personalizada. Use com cuidado, pois pode confundir os usuários do framework. Leia mais no guia [Comando personalizado](/docs/customcommands#overwriting-native-commands). |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | Permite definir uma estratégia de seletor personalizada, leia mais no guia [Seletores](/docs/selectors#custom-selector-strategies).                                                                                                            |

## Observações

### Mobile Flags

Se precisar modificar seu teste com base no fato de sua sessão ser executada ou não em um dispositivo móvel, você pode acessar os sinalizadores móveis para verificar.

Por exemplo, dada esta configuração:

```js
// wdio.conf.js
export const config = {
    // ...
    capabilities: \\{
        platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
        // ...
    }
    // ...
}
```

Você pode acessar esses sinalizadores em seu teste assim:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

Isso pode ser útil se, por exemplo, você quiser definir seletores em seus [objetos de página](../pageobjects) com base no tipo de dispositivo, assim:

```js
// mypageobject.page.js
import Page from './page'

class LoginPage extends Page {
    // ...
    get username() {
        const selectorAndroid = 'new UiSelector().text("Cancel").className("android.widget.Button")'
        const selectorIOS = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
        const selectorType = driver.isAndroid ? 'android' : 'ios'
        const selector = driver.isAndroid ? selectorAndroid : selectorIOS
        return $(`${selectorType}=${selector}`)
    }
    // ...
}
```

Você também pode usar esses sinalizadores para executar apenas determinados testes para determinados tipos de dispositivos:

```js
// mytest.e2e.js
describe('my test', () => {
    // ...
    // only run test with Android devices
    if (driver.isAndroid) {
        it('tests something only for Android', () => {
            // ...
        })
    }
    // ...
})
```

### Eventos
O objeto do navegador é um EventEmitter e alguns eventos são emitidos para seus casos de uso.

Aqui está uma lista de eventos. Tenha em mente que esta ainda não é a lista completa de eventos disponíveis. Sinta-se à vontade para contribuir para atualizar o documento adicionando descrições de mais eventos aqui.

#### `command`

Este evento é emitido sempre que o WebdriverIO envia um comando WebDriver Classic. Ele contém as seguintes informações:

- `command`: o nome do comando, por exemplo, `navigateTo`
- `método`: o método HTTP usado para enviar a solicitação de comando, por exemplo, `POST`
- `endpoint`: o ponto final do comando, por exemplo `/session/fc8dbda381a8bea36a225bd5fd0c069b/url`
- `body`: a carga útil do comando, por exemplo `{ url: 'https://webdriver.io' }`

#### `result`

Este evento é emitido sempre que o WebdriverIO recebe um resultado de um comando do WebDriver Classic. Ele contém as mesmas informações do evento `comando` com a adição das seguintes informações:

- `result`: o resultado do comando

#### `bidiCommand`

Este evento é emitido sempre que o WebdriverIO envia um comando WebDriver Classic. Ele contém informações sobre:

- `método`: Método de comando WebDriver Bidi
- `params`: parâmetro de comando associado (veja [API](/docs/api/webdriverBidi))

#### `bidiResult`

Em caso de execução bem-sucedida do comando, a carga útil do evento será:

- `type`: `success`
- `id`: o id do comando
- `result`: o resultado do comando (veja [API](/docs/api/webdriverBidi))

Em caso de erro de comando, a carga útil do evento será:

- `type`: `error`
- `id`: o id do comando
- `error`: o código de erro, por exemplo, `argumento inválido`
- `mensagem`: detalhes sobre o erro
- `stacktrace`: a stack trace

#### `request.start`
Este evento é disparado antes que uma solicitação WebDriver seja enviada ao driver. Ele contém informações sobre a solicitação e sua carga útil.

```ts
browser.on('request.start', (ev: RequestInit) => {
    // ...
})
```

#### `request.end`
Este evento é disparado quando a solicitação ao driver recebe uma resposta. O objeto de evento contém o corpo da resposta como resultado ou um erro se o comando WebDriver falhou.

```ts
browser.on('request.end', (ev: { result: unknown, error?: Error }) => {
    // ...
})
```

#### `request.retry`
O evento de repetição pode notificá-lo quando o WebdriverIO tenta executar o comando novamente, por exemplo, devido a um problema de rede. Ele contém informações sobre o erro que causou a nova tentativa e a quantidade de tentativas já feitas.

```ts
browser.on('request.retry', (ev: { error: Error, retryCount: number }) => {
    // ...
})
```

#### `request.performance`
Este é um evento para medir operações no nível do WebDriver. Sempre que o WebdriverIO enviar uma solicitação ao backend do WebDriver, este evento será emitido com algumas informações úteis:

- `durationMillisecond`: Duração da solicitação em milissegundos.
- `error`: Objeto de erro se a solicitação falhou.
- `request`: Objeto de solicitação. Você pode encontrar url, método, cabeçalhos, etc.
- `retryCount`: Se for `0`, a solicitação foi a primeira tentativa. Ele aumentará quando o WebDriverIO tentar novamente nos bastidores.
- `sucesso`: Booleano para representar se a solicitação foi bem-sucedida ou não. Se for `false`, a propriedade `error` também será fornecida.

Um exemplo de evento:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Comandos personalizados

Você pode definir comandos personalizados no escopo do navegador para abstrair fluxos de trabalho comumente usados. Confira nosso guia sobre [Comandos personalizados](/docs/customcommands#adding-custom-commands) para obter mais informações.
