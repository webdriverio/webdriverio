---
id: modules
title: Módulos
---

O WebdriverIO publica vários módulos no NPM e outros registros que você pode usar para criar sua própria estrutura de automação. Veja mais documentação sobre os tipos de configuração do WebdriverIO [aqui](/docs/setuptypes).

## `webdriver` e `devtools`

Os pacotes de protocolo ([`webdriver`](https://www.npmjs.com/package/webdriver) e [`devtools`](https://www.npmjs.com/package/devtools)) expõem uma classe com as seguintes funções estáticas anexadas que permitem iniciar sessões:

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

Inicia uma nova sessão com recursos específicos. Com base na resposta da sessão, serão fornecidos comandos de diferentes protocolos.

##### Parâmetros

- `options`: [Opções do WebDriver](/docs/configuration#webdriver-options)
- `modifier`: função que permite modificar a instância do cliente antes que ela seja retornada
- `userPrototype`: objeto de propriedades que permite estender o protótipo da instância
- `customCommandWrapper`: função que permite envolver a funcionalidade em torno de chamadas de função

##### Retornos

- Objeto [Navegador](/docs/api/browser)

##### Exemplo

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachToSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

Anexa-se a uma sessão em execução do WebDriver ou DevTools.

##### Parâmetros

- `attachInstance`: instância para anexar uma sessão ou pelo menos um objeto com uma propriedade `sessionId` (por exemplo, `{ sessionId: 'xxx' }`)
- `modifier`: função que permite modificar a instância do cliente antes que ela seja retornada
- `userPrototype`: objeto de propriedades que permite estender o protótipo da instância
- `customCommandWrapper`: função que permite envolver a funcionalidade em torno de chamadas de função

##### Retornos

- [Browser](/docs/api/browser) object

##### Exemplo

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachToSession(client)
```

#### `reloadSession(instance)`

Recarrega uma sessão dada a instância fornecida.

##### Parâmetros

- `instance`: instância do pacote para recarregar

##### Exemplo

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

Semelhante aos pacotes de protocolo (`webdriver` e `devtools`), você também pode usar as APIs do pacote WebdriverIO para gerenciar sessões. As APIs podem ser importadas usando `import { remote, attach, multiremote } from 'webdriverio` e contêm as seguintes funcionalidades:

#### `remote(options, modifier)`

Inicia uma sessão WebdriverIO. A instância contém todos os comandos do pacote de protocolo, mas com funções adicionais de ordem superior. Consulte [Documentação da API](/docs/api).

##### Parâmetros

- `options`: [Opções do WebdriverIO](/docs/configuration#webdriverio)
- `modifier`: função que permite modificar a instância do cliente antes que ela seja retornada

##### Retornos

- Objeto [Navegador](/docs/api/browser)

##### Exemplo

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

Anexa-se a uma sessão WebdriverIO em execução.

##### Parâmetros

- `attachOptions`: instância para anexar uma sessão ou pelo menos um objeto com uma propriedade `sessionId` (por exemplo, `{ sessionId: 'xxx' }`)

##### Retorno

- Objeto [Navegador](/docs/api/browser)

##### Exemplo

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

Inicia uma instância multiremota que permite controlar várias sessões dentro de uma única instância. Confira nossos [exemplos multiremote](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) para casos de uso concretos.

##### Parâmetros

- `multiremoteOptions`: um objeto com chaves que representam o nome do navegador e suas [Opções do WebdriverIO](/docs/configuration#webdriverio).

##### Retornos

- Objeto [Navegador](/docs/api/browser)

##### Exemplo

```js
import { multiremote } from 'webdriverio'

const matrix = await multiremote({
    myChromeBrowser: {
        capabilities: { browserName: 'chrome' }
    },
    myFirefoxBrowser: {
        capabilities: { browserName: 'firefox' }
    }
})
await matrix.url('http://json.org')
await matrix.getInstance('browserA').url('https://google.com')

console.log(await matrix.getTitle())
// returns ['Google', 'JSON']
```

## `@wdio/cli`

Em vez de chamar o comando `wdio`, você também pode incluir o executor de teste como módulo e executá-lo em um ambiente arbitrário. Para isso, você precisará solicitar o pacote `@wdio/cli` como módulo, assim:

<Tabs
  defaultValue="esm"
  values={[
    {label: 'EcmaScript Modules', value: 'esm'},
 {label: 'CommonJS', value: 'cjs'}
 ]
}>
<TabItem value="esm">

```js
import Launcher from '@wdio/cli'
```

</TabItem>
<TabItem value="cjs">

```js
const Launcher = require('@wdio/cli').default
```

</TabItem>
</Tabs>

Depois disso, crie uma instância do inicializador e execute o teste.

#### `Launcher(configPath, opts)`

O construtor da classe `Launcher` espera a URL para o arquivo de configuração e um objeto `opts` com configurações que substituirão aquelas na configuração.

##### Parâmetros

- `configPath`: caminho para o `wdio.conf.js` a ser executado
- `opts`: argumentos ([`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77)) para substituir valores do arquivo de configuração

##### Exemplo

```js
const wdio = new Launcher(
    '/path/to/my/wdio.conf.js',
    { spec: '/path/to/a/single/spec.e2e.js' }
)

wdio.run().then((exitCode) => {
    process.exit(exitCode)
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace)
    process.exit(1)
})
```

O comando `run` retorna uma [Promessa](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). Ele é resolvido se os testes foram executados com sucesso ou falharam, sendo negado se o inicializador não conseguiu iniciar a execução dos testes.

## `@wdio/browser-runner`

Ao executar testes de unidade ou componente usando o WebAo executar testes de unidade ou componente usando o [browser runner](/docs/runner#browser-runner) do WebdriverIO, você pode importar utilitários de simulação para seus testes, por exemplo: [browser runner](/docs/runner#browser-runner) do driverIO, você pode importar utilitários de simulação para seus testes, por exemplo:

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

As seguintes exportações nomeadas estão disponíveis:

#### `fn`

Função simulada, veja mais na [documentação oficial do Vitest](https://vitest.dev/api/mock.html#mock-functions).

#### `spyOn`

Função espiã, veja mais na [documentação oficial do Vitest](https://vitest.dev/api/mock.html#mock-functions).

#### `mock`

Método para simular arquivo ou módulo de dependência.

##### Parâmetros

- `moduleName`: um caminho relativo para o arquivo a ser simulado ou um nome de módulo.
- `factory`: função para retornar o valor simulado (opcional)

##### Exemplo

```js
mock('../src/constants.ts', () => ({
    SOME_DEFAULT: 'mocked out'
}))

mock('lodash', (origModuleFactory) => {
    const origModule = await origModuleFactory()
    return {
        ...origModule,
        pick: fn()
    }
})
```

#### `unmock`

Dependência Unmock definida dentro do diretório de simulação manual (`__mocks__`).

##### Parâmetros

- `moduleName`: nome do módulo a ser desmockeado.

##### Exemplo

```js
unmock('lodash')
```
