---
id: configuration
title: Configuração
---

Com base no [tipo de configuração](/docs/setuptypes) (por exemplo, usando as ligações de protocolo bruto, o WebdriverIO como pacote autônomo ou o WDIO testrunner), há um conjunto diferente de opções disponíveis para controlar o ambiente.

## Opções WebDriver

As seguintes opções são definidas ao usar o pacote de protocolo [`webdriver`](https://www.npmjs.com/package/webdriver):

### protocol

Protocolo a ser usado na comunicação com o servidor do driver.

Type: `String`<br /> Default: `http`

### hostname

Host do seu servidor de driver

Tipo: `String`<br /> Padrão: `0.0.0.0`

### port

A porta em que seu servidor de driver está instalado.

Tipo: `Número`<br /> Padrão: `indefinido`

### path

Caminho para o ponto final do servidor do driver.

Type: `String`<br /> Default: `/`

### queryParams

Parâmetros de consulta que são propagados para o servidor do driver.

Tipo: `Objeto`<br /> Padrão: `indefinido`

### user

Seu nome de usuário do serviço de nuvem (funciona somente para contas [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com) ou [LambdaTest](https://www.lambdatest.com)). Se definido, o WebdriverIO definirá automaticamente as opções de conexão para você. Se você não usa um provedor de nuvem, isso pode ser usado para autenticar qualquer outro backend do WebDriver.

Tipo: `String`<br /> Padrão: `indefinido`

### key

Sua chave de acesso ao serviço de nuvem ou chave secreta (funciona somente para contas [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com) ou [LambdaTest](https://www.lambdatest.com)). Se definido, o WebdriverIO definirá automaticamente as opções de conexão para você. Se você não usa um provedor de nuvem, isso pode ser usado para autenticar qualquer outro backend do WebDriver.

Tipo: `String`<br /> Padrão: `indefinido`

### capabilities

Define os recursos que você deseja executar na sua sessão do WebDriver. Confira o [Protocolo WebDriver](https://w3c.github.io/webdriver/#capabilities) para mais detalhes. Se você executar um driver mais antigo que não suporta o protocolo WebDriver, será necessário usar os [recursos do JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) para executar uma sessão com sucesso.

Além dos recursos baseados no WebDriver, você pode aplicar opções específicas do navegador e do fornecedor que permitem uma configuração mais profunda no navegador ou dispositivo remoto. Eles estão documentados nos documentos do fornecedor correspondente, por exemplo:

- `goog:chromeOptions`: for [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

Além disso, um utilitário útil é o [Automated Test Configurator](https://docs.saucelabs.com/basics/platform-configurator/) do Sauce Labs, que ajuda você a criar esse objeto clicando nos recursos desejados.

Type: `Object`<br /> Default: `null`

**Exemplo:**

```js
{
    browserName: 'chrome', // options: `chrome`, `edge`, `firefox`, `safari`
    browserVersion: '27.0', // versão do navegador
    platformName: 'Windows 10' // OS platform
}
```

Se você estiver executando testes nativos ou da web em dispositivos móveis, `capabilities` difere do protocolo WebDriver. Veja [Appium Docs](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/) para mais detalhes.

### logLevel

Nível de verbosidade do log.

Type: `String`<br /> Default: `info`<br /> Options: `trace` | `debug` | `info` | `warn` | `error` | `silent`

### outputDir

Diretório para armazenar todos os arquivos de log do testrunner (incluindo logs do reporter e logs `wdio`). Se não for definido, todos os logs serão transmitidos para `stdout`. Como a maioria dos relatores são feitos para registrar em `stdout`, é recomendado usar esta opção somente para relatores específicos onde faz mais sentido enviar o relatório para um arquivo (como o relator `junit`, por exemplo).

Ao executar no modo autônomo, o único log gerado pelo WebdriverIO será o log `wdio`.

Type: `String`<br /> Default: `null`

### connectionRetryTimeout

Tempo limite para qualquer solicitação do WebDriver para um driver ou grade.

Type: `Number`<br /> Default: `120000`

### connectionRetryCount

Contagem máxima de tentativas de solicitação para o servidor Selenium.

Type: `Number`<br /> Default: `3`

### agent

Permite que você use um `http`/`https`/`http2` [agente](https://www.npmjs.com/package/got#agent) personalizado para fazer solicitações.

Type: `Object`<br /> Default:

```js
{
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}
```

### headers

Especifique `cabeçalhos` personalizados para passar em cada solicitação do WebDriver. Se o seu Selenium Grid exigir autenticação básica, recomendamos passar um cabeçalho `Authorization` por meio desta opção para autenticar suas solicitações do WebDriver, por exemplo:

```ts wdio.conf.ts
import { Buffer } from 'buffer';
// Leia o nome de usuário e a senha das variáveis ​​de ambiente

const username = process.env.SELENIUM_GRID_USERNAME;
const password = process.env.SELENIUM_GRID_PASSWORD;

// Combine o nome de usuário e a senha com um separador de dois pontos
const credentials = `${username}:${password}`;
// Codifique as credenciais usando Base64
const encodedCredentials = Buffer.from(credentials).toString('base64');

export const config: WebdriverIO.Config = {
// ...
    headers: {
        Authorization: `Basic ${encodedCredentials}`
    }
    // ...
}
```

Tipo: `Objeto`<br /> Padrão: `{}`

### transformRequest

Função interceptando [opções de solicitação HTTP](https://github.com/sindresorhus/got#options) antes que uma solicitação WebDriver seja feita

Tipo: `(RequestOptions) => RequestOptions`<br /> Padrão: *nenhum*

### transformResponse

Função que intercepta objetos de resposta HTTP após a chegada de uma resposta do WebDriver. A função recebe o objeto de resposta original como o primeiro argumento e o `RequestOptions` correspondente como o segundo argumento.

Tipo: `(Response, RequestOptions) => Resposta`<br /> Padrão: *none*

### strictSSL

Se não requer certificado SSL para ser válido. Ele pode ser definido por meio de variáveis ​​de ambiente como `STRICT_SSL` ou `strict_ssl`.

Tipo: `Boolean`<br /> Padrão: `true`

### enableDirectConnect

Se você deseja habilitar o [recurso de conexão direta do Appium](https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments). Não faz nada se a resposta não tiver chaves adequadas enquanto o sinalizador estiver habilitado.

Tipo: `Boolean`<br /> Padrão: `true`

### cacheDir

O caminho para a raiz do diretório de cache. Este diretório é usado para armazenar todos os drivers baixados ao tentar iniciar uma sessão.

Tipo: `String`<br /> Padrão: `process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()`

---

## WebdriverIO

As seguintes opções (incluindo as listadas acima) podem ser usadas com o WebdriverIO de forma autônoma:

### automationProtocol

Defina o protocolo que você deseja usar para a automação do seu navegador. Atualmente, apenas [`webdriver`](https://www.npmjs.com/package/webdriver) é suportado, pois é a principal tecnologia de automação de navegador usada pelo WebdriverIO.

Se você quiser automatizar o navegador usando uma tecnologia de automação diferente, defina esta propriedade como um caminho que resolva um módulo que adere à seguinte interface:

```ts
import type { Capabilities } from '@wdio/types';
import type { Client, AttachOptions } from 'webdriver';

export default class YourAutomationLibrary {
/**
* Inicie uma sessão de automação e retorne um WebdriverIO [monad](https://github.com/webdriverio/webdriverio/blob/940cd30939864bdbdacb2e94ee6e8ada9b1cc74c/packages/wdio-utils/src/monad.ts)
* com os respectivos comandos de automação. Veja o pacote [webdriver](https://www.npmjs.com/package/webdriver)
* como uma implementação de referência
*
* @param {Capabilities.RemoteConfig} opções Opções do WebdriverIO
* @param {Function} hook que permite modificar o cliente antes que ele seja liberado da função
* @param {PropertyDescriptorMap} userPrototype permite que o usuário adicione comandos de protocolo personalizados
* @param {Function} customCommandWrapper permite modificar a execução do comando
* @returns uma instância de cliente compatível com WebdriverIO
*/
static newSession(
options: Capabilities.RemoteConfig,
modifier?: (...args: any[]) => any,
userPrototype?: PropertyDescriptorMap,
customCommandWrapper?: (...args: any[]) => any
): Promise<Client>;

/**
* permite que o usuário anexe a sessões existentes
* @optional
*/
static attachToSession(
options?: AttachOptions,
modifier?: (...args: any[]) => any, userPrototype?: {},
commandWrapper?: (...args: any[]) => any
): Client;

/**
* Altera o ID da sessão da instância e os recursos do navegador para a nova sessão
* diretamente no objeto do navegador passado
*
* @optional
* @param {object} instance o objeto que obtemos de uma nova sessão do navegador.
     * @returns {string} o novo id de sessão do navegador
*/
static reloadSession(
instance: Client,
newCapabilities?: WebdriverIO.Capabilitie
): Promise<string>;
}
```

Tipo: `String`<br /> Padrão: `webdriver`

### baseUrl

Encurte chamadas de comando `url` definindo uma URL base.
- Se o seu parâmetro `url` começar com `/`, então `baseUrl` será prefixado (exceto o caminho `baseUrl`, se houver um).
- If your `url` parameter starts without a scheme or `/` (like `some/path`), then the full `baseUrl` is prepended directly.

Type: `String`<br /> Default: `null`

### waitforTimeout

Default timeout for all `waitFor*` commands. (Note the lowercase `f` in the option name.) This timeout __only__ affects commands starting with `waitFor*` and their default wait time.

To increase the timeout for a _test_, please see the framework docs.

Type: `Number`<br /> Default: `5000`

### waitforInterval

Default interval for all `waitFor*` commands to check if an expected state (e.g., visibility) has been changed.

Type: `Number`<br /> Default: `100`

### region

If running on Sauce Labs, you can choose to run tests between different data centers: US or EU. To change your region to EU, add `region: 'eu'` to your config.

__Note:__ This only has an effect if you provide `user` and `key` options that are connected to your Sauce Labs account.

Type: `String`<br /> Default: `us`

*(only for vm and or em/simulators)*

---

## Testrunner Options

The following options (including the ones listed above) are defined only for running WebdriverIO with the WDIO testrunner:

### specs

Define specs for test execution. You can either specify a glob pattern to match multiple files at once or wrap a glob or set of paths into an array to run them within a single worker process. All paths are seen as relative from the config file path.

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

Exclude specs from test execution. All paths are seen as relative from the config file path.

Type: `String[]`<br /> Default: `[]`

### suites

An object describing various of suites, which you can then specify with the `--suite` option on the `wdio` CLI.

Type: `Object`<br /> Default: `{}`

### capabilities

The same as the `capabilities` section described above, except with the option to specify either a [`multiremote`](/docs/multiremote) object, or multiple WebDriver sessions in an array for parallel execution.

You can apply the same vendor and browser specific capabilities as defined [above](/docs/configuration#capabilities).

Type: `Object`|`Object[]`<br /> Default: `[{ 'wdio:maxInstances': 5, browserName: 'firefox' }]`

### maxInstances

Maximum number of total parallel running workers.

__Note:__ that it may be a number as high as `100`, when the tests are being performed on some external vendors such as Sauce Labs's machines. There, the tests are not tested on a single machine, but rather, on multiple VMs. If the tests are to be run on a local development machine, use a number that is more reasonable, such as `3`, `4`, or `5`. Essentially, this is the number of browsers that will be concurrently started and running your tests at the same time, so it depends on how much RAM there is on your machine, and how many other apps are running on your machine.

You can also apply `maxInstances` within your capability objects using the `wdio:maxInstances` capability. This will limit the amount of parallel sessions for that particular capability.

Type: `Number`<br /> Default: `100`

### maxInstancesPerCapability

Maximum number of total parallel running workers per capability.

Type: `Number`<br /> Default: `100`

### injectGlobals

Inserts WebdriverIO's globals (e.g. `browser`, `$` and `$$`) into the global environment. If you set to `false`, you should import from `@wdio/globals`, e.g.:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

Note: WebdriverIO doesn't handle injection of test framework specific globals.

Type: `Boolean`<br /> Default: `true`

### bail

If you want your test run to stop after a specific number of test failures, use `bail`. (It defaults to `0`, which runs all tests no matter what.) **Note:** A test in this context are all tests within a single spec file (when using Mocha or Jasmine) or all steps within a feature file (when using Cucumber). If you want to control the bail behavior within tests of a single test file, take a look at the available [framework](frameworks) options.

Type: `Number`<br /> Default: `0` (don't bail; run all tests)

### specFileRetries

The number of times to retry an entire specfile when it fails as a whole.

Type: `Number`<br /> Default: `0`

### specFileRetriesDelay

Delay in seconds between the spec file retry attempts

Tipo: `Número`<br /> Padrão: `0`

### specFileRetriesDeferred

Se os arquivos de especificação repetidos devem ser repetidos imediatamente ou adiados para o final da fila.

Tipo: `Boolean`<br /> Padrão: `true`

### groupLogsByTestSpec

Escolha a visualização de saída do log.

If set to `false` logs from different test files will be printed in real-time. Observe que isso pode resultar na mistura de saídas de log de arquivos diferentes quando executado em paralelo.

Se definido como `true`, as saídas de log serão agrupadas por especificação de teste e impressas somente quando a especificação de teste for concluída.

Por padrão, ele é definido como `false` para que os logs sejam impressos em tempo real.

Tipo: `Boolean`<br /> Padrão: `false`

### services

Os serviços assumem uma tarefa específica que você não quer cuidar. Eles aprimoram sua configuração de teste com quase nenhum esforço.

Tipo: `String[]|Object[]`<br /> Padrão: `[]`

### framework

Define a estrutura de teste a ser usada pelo executor de testes WDIO.

Tipo: `String`<br /> Padrão: `mocha`<br /> Opções: `mocha` | `jasmine`

### mochaOpts, jasmineOpts and cucumberOpts

Opções específicas relacionadas à estrutura. Consulte a documentação do adaptador de estrutura para saber quais opções estão disponíveis. Leia mais sobre isso em [Frameworks](frameworks).

Tipo: `Objeto`<br /> Padrão: `{ timeout: 10000 }`

### cucumberFeaturesWithLineNumbers

Lista de recursos do Cucumber com números de linha (ao [usar o framework Cucumber](./Frameworks.md#using-cucumber)).

Tipo: `String[]` Padrão: `[]`

### reporters

Lista de repórteres a serem usados. Um repórter pode ser uma string ou uma matriz de `['reporterName', { /* reporter options */}]` onde o primeiro elemento é uma string com o nome do repórter e o segundo elemento um objeto com opções do repórter.

Tipo: `String[]|Object[]`<br /> Padrão: `[]`

Exemplo:

```js
reporters: [
    'dot',
    'spec'
    ['junit', {
        outputDir: `${__dirname}/reports`,
        otherOption: 'foobar'
    }]
]
```

### reporterSyncInterval

Determina em qual intervalo o relator deve verificar se eles estão sincronizados caso relatem seus logs de forma assíncrona (por exemplo, se os logs forem transmitidos para um fornecedor terceirizado).

Tipo: `Número`<br /> Padrão: `100` (ms)

### reporterSyncTimeout

Determina o tempo máximo que os repórteres têm para terminar de enviar todos os seus logs até que um erro seja gerado pelo executor de teste.

Tipo: `Número`<br /> Padrão: `5000` (ms)

### execArgv

Argumentos de nó para especificar ao iniciar processos filho.

Tipo: `String[]`<br /> Padrão: `null`

### filesToWatch

Uma lista de padrões de string de suporte glob que informam ao executor de testes para monitorar outros arquivos, por exemplo, arquivos de aplicativo, ao executá-lo com o sinalizador `--watch`. Por padrão, o testrunner já monitora todos os arquivos de especificação.

Tipo: `String[]`<br /> Padrão: `[]`

### updateSnapshots

Defina como verdadeiro se quiser atualizar seus instantâneos. Idealmente usado como parte de um parâmetro CLI, por exemplo, `wdio run wdio.conf.js --s`.

Tipo: `'new' | 'all' | 'none'`<br /> Padrão: `none` se não fornecido e os testes forem executados em CI, `new` se não fornecido, caso contrário, o que foi fornecido

### resolveSnapshotPath

Substitui o caminho padrão do instantâneo. Por exemplo, para armazenar instantâneos ao lado de arquivos de teste.

```js reference useHTTPS
https://github.com/webdriverio/webdriverio/blob/main/website/recipes/resolve-snapshot-path.js
```

Tipo: `(testPath: string, snapExtension: string) => string`<br /> Padrão: armazena arquivos de snapshot no diretório `__snapshots__` próximo ao arquivo de teste

### tsConfigPath

O WDIO usa `tsx` para compilar arquivos TypeScript.  Seu TSConfig é detectado automaticamente no diretório de trabalho atual, mas você pode especificar um caminho personalizado aqui ou definindo a variável de ambiente TSX_TSCONFIG_PATH.

Veja a documentação do `tsx`: https://tsx.is/dev-api/node-cli#custom-tsconfig-json-path

Tipo: `String`<br /> Padrão: `null`<br />

## Hooks

O WDIO testrunner permite que você defina ganchos para serem acionados em momentos específicos do ciclo de vida do teste. This allows custom actions (e.g. take screenshot if a test fails).

Every hook has as parameter specific information about the lifecycle (e.g. information about the test suite or test). Read more about all hook properties in [our example config](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L183-L326).

**Note:** Some hooks (`onPrepare`, `onWorkerStart`, `onWorkerEnd` and `onComplete`) are executed in a different process and therefore can not share any global data with the other hooks that live in the worker process.

### onPrepare

Gets executed once before all workers get launched.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `param` (`object[]`): list of capabilities details

### onWorkerStart

Gets executed before a worker process is spawned and can be used to initialize specific service for that worker as well as modify runtime environments in an async fashion.

Parameters:

- `cid` (`string`): capability id (e.g 0-0)
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `args` (`object`): object that will be merged with the main configuration once worker is initialized
- `execArgv` (`string[]`): list of string arguments passed to the worker process

### onWorkerEnd

Gets executed just after a worker process has exited.

Parameters:

- `cid` (`string`): capability id (e.g 0-0)
- `exitCode` (`number`): 0 - success, 1 - fail
- `specs` (`string[]`): specs to be run in the worker process
- `retries` (`number`): number of spec level retries used as defined in [_"Add retries on a per-specfile basis"_](./Retry.md#add-retries-on-a-per-specfile-basis)

### beforeSession

Gets executed just before initializing the webdriver session and test framework. It allows you to manipulate configurations depending on the capability or spec.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### before

Gets executed before test execution begins. At this point you can access to all global variables like `browser`. It is the perfect place to define custom commands.

Parameters:

- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `browser` (`object`): instance of created browser/device session

### beforeSuite

Hook that gets executed before the suite starts (in Mocha/Jasmine only)

Parameters:

- `suite` (`object`): suite details

### beforeHook

Hook that gets executed *before* a hook within the suite starts (e.g. runs before calling beforeEach in Mocha)

Parameters:

- `test` (`object`): test details
- `context` (`object`): test context (represents World object in Cucumber)

### afterHook

Hook that gets executed *after* a hook within the suite ends (e.g. runs after calling afterEach in Mocha)

Parameters:

- `test` (`object`): test details
- `context` (`object`): test context (represents World object in Cucumber)
- `result` (`object`): hook result (contains `error`, `result`, `duration`, `passed`, `retries` properties)

### beforeTest

Function to be executed before a test (in Mocha/Jasmine only).

Parameters:

- `test` (`object`): test details
- `context` (`object`): scope object the test was executed with

### beforeCommand

Isso permite ações personalizadas (por exemplo, fazer uma captura de tela se um teste falhar).

Parâmetros:

- `commandName` (`string`): nome do comando
- `args` (`*`): argumentos que o comando receberia

### afterCommand

É executado após um comando WebdriverIO ser executado.

Parâmetros:

- `commandName` (`string`): nome do comando
- `args` (`*`): argumentos que o comando receberia
- `resultado` (`número`): 0 - comando bem-sucedido, 1 - comando errado
- `error` (`Error`): objeto de erro se houver

### afterTest

Função a ser executada após o término de um teste (em Mocha/Jasmine).

Parâmetros:

- `test` (`object`): detalhes do teste
- `context` (`object`): objeto de escopo com o qual o teste foi executado
- `result.error` (`Error`): objeto de erro caso o teste falhe, caso contrário `undefined`
- `result.result` (`Any`): retorna objeto da função de teste
- `result.duration` (`Number`): duração do teste
- `result.passed` (`Boolean`): verdadeiro se o teste foi aprovado, caso contrário falso
- `result.retries` (`Object`): informações sobre tentativas relacionadas a testes individuais, conforme definido para [Mocha e Jasmine](./Retry.md#rerun-single-tests-in-jasmine-or-mocha), bem como [Cucumber](./Retry.md#rerunning-in-cucumber), por exemplo, `{ attempts: 0, limit: 0 }`, consulte
- `result` (`object`): resultado do hook (contém as propriedades `error`, `result`, `duration`, `passed`, `retries`)

### afterSuite

Gancho que é executado após o término da suíte (somente em Mocha/Jasmine)

Parâmetros:

- `suite` (`object`): detalhes da suíte

### after

É executado depois que todos os testes são feitos. Você ainda tem acesso a todas as variáveis ​​globais do teste.

Parâmetros:

- `result` (`number`): 0 - teste aprovado, 1 - teste reprovado
- `caps` (`object`): contendo recursos para a sessão que serão gerados no trabalhador
- `specs` (`string[]`): especificações a serem executadas no processo de trabalho

### afterSession

É executado logo após o término da sessão do webdriver.

Parâmetros:

- `config` (`object`): Objeto de configuração do WebdriverIO
- `caps` (`object`): contendo recursos para a sessão que serão gerados no trabalhador
- `specs` (`string[]`): especificações a serem executadas no processo de trabalho

### onComplete

É executado depois que todos os trabalhadores são desligados e o processo está prestes a sair. Um erro gerado no gancho onComplete resultará na falha da execução do teste.

Parâmetros:

- `exitCode` (`number`): 0 - success, 1 - falha
- `config` (`object`): Objeto de configuração do WebdriverIO
- `caps` (`object`): contendo recursos para a sessão que serão gerados no trabalhador
- `result` (`object`): objeto results contendo resultados de teste

### onReload

É executado quando ocorre uma atualização.

Parâmetros:

- `oldSessionId` (`string`): ID da sessão antiga
- `newSessionId` (`string`): ID da nova sessão

### beforeFeature

É exibido antes de um filme do Cucumber.

Parameters:

- `uri` (`string`): caminho para o arquivo de recursos
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Objeto de feature Cucumber

### afterFeature

Corre atrás de um recurso do Cucumber.

Parâmetros:

- `uri` (`string`): caminho para o arquivo de recursos
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Objeto de feature Cucumber

### beforeScenario

É executado antes de um cenário de Cucumber.

Parâmetros:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): objeto world contendo informações sobre pickle e etapa de teste
- `contexto` (`objeto`): Objeto Cucumber World

### afterScenario

Corre atrás de um cenário de Cucumber.

Parâmetros:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): objeto world contendo informações sobre pickle e etapa de teste
- `result` (`object`): objeto results contendo resultados do cenário
- `result.passed` (`boolean`): verdadeiro se o cenário foi aprovado
- `result.error` (`string`): pilha de erros se o cenário falhou
- `result.duration` (`number`): duração do cenário em milissegundos
- `context` (`object`): Objeto Cucumber World

### beforeStep

Corre antes de um Cucumber Step.

Parâmetros:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Objeto de passo Cucumber
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Objeto de cenário Cucumber
- `contexto` (`objeto`): Objeto Cucumber World

### afterStep

Corre atrás de um Cucumber Step.

Parâmetros:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Objeto de passo Cucumber
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Objeto de cenário Cucumber
- `result`: (`object`): objeto results contendo resultados de etapas
- `result.passed` (`boolean`): verdadeiro se o cenário foi aprovado
- `result.error` (`string`): pilha de erros se o cenário falhou
- `result.duration` (`number`): duração do cenário em milissegundos
- `contexto` (`objeto`): Objeto Cucumber World

### beforeAssertion

Gancho que é executado antes que uma asserção WebdriverIO aconteça.

Parâmetros:

- `params`: informações de asserção
- `params.matcherName` (`string`): nome do correspondente (por exemplo, `toHaveTitle`)
- `params.expectedValue`: valor que é passado para o matcher
- `params.options`: opções de asserção

### afterAssertion

Gancho que é executado após uma asserção WebdriverIO ocorrer.

Parâmetros:

- `params`: informações de asserção
- `params.matcherName` (`string`): nome do correspondente (por exemplo, `toHaveTitle`)
- `params.expectedValue`: valor que é passado para o matcher
- `params.options`: opções de asserção
- `params.result`: resultados de asserção
