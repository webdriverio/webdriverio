---
id: frameworks
title: Frameworks
---

O WebdriverIO Runner tem suporte integrado para [Mocha](http://mochajs.org/), [Jasmine](http://jasmine.github.io/) e [Cucumber.js](https://cucumber.io/). Você também pode integrá-lo com estruturas de código aberto de terceiros, como [Serenity/JS](#using-serenityjs).

:::dica Integrando WebdriverIO com frameworks de teste
Para integrar o WebdriverIO com um framework de teste, você precisa de um pacote adaptador disponível no NPM. Observe que o pacote do adaptador deve ser instalado no mesmo local onde o WebdriverIO está instalado. Portanto, se você instalou o WebdriverIO globalmente, certifique-se de instalar o pacote do adaptador globalmente também.
:::

Integrar o WebdriverIO com uma estrutura de teste permite que você acesse a instância do WebDriver usando a variável global `browser` em seus arquivos de especificação ou definições de etapas. Observe que o WebdriverIO também cuidará de instanciar e encerrar a sessão do Selenium, então você não precisa fazer isso você mesmo.

## Usando Mocha

Primeiro, instale o pacote do adaptador do NPM:

```bash npm2yarn
npm install @wdio/mocha-framework --save-dev
```

Por padrão, o WebdriverIO fornece uma [biblioteca de asserções](assertion) integrada que você pode iniciar imediatamente:

```js
describe('my awesome website', () => {
    it('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

O WebdriverIO suporta as interfaces `BDD` (padrão), `TDD` e `QUnit` [do Mocha](https://mochajs.org/#interfaces).

Se você gosta de escrever suas especificações no estilo TDD, defina a propriedade `ui` na sua configuração `mochaOpts` como `tdd`. Agora seus arquivos de teste devem ser escritos assim

```js
suite('my awesome website', () => {
    test('should do some assertions', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

Se você quiser definir outras configurações específicas do Mocha, poderá fazê-lo com a chave `mochaOpts` no seu arquivo de configuração. Uma lista de todas as opções pode ser encontrada no [site do projeto Mocha](https://mochajs.org/api/mocha).

__Observação:__ o WebdriverIO não oferece suporte ao uso obsoleto de retornos de chamada `done` no Mocha:

```js
it('should test something', (done) => {
    done() // throws "done is not a function"
})
```

### Opções de Mocha

As seguintes opções podem ser aplicadas em seu `wdio.conf.js` para configurar seu ambiente Mocha. __Observação:__ nem todas as opções são suportadas, por exemplo, aplicar a opção `parallel` causará um erro, pois o WDIO testrunner tem sua própria maneira de executar testes em paralelo. Você pode passar essas opções de estrutura como argumentos, por exemplo:

```sh
wdio run wdio.conf.ts --mochaOpts.grep "my test" --mochaOpts.bail --no-mochaOpts.checkLeaks
```

Isso passará pelas seguintes opções de Mocha:

```ts
{
    grep: ['my-test'],
    bail: true
    checkLeacks: false
}
```

As seguintes opções de Mocha são suportadas:

#### require
A opção `require` é útil quando você deseja adicionar ou estender alguma funcionalidade básica (opção do framework WebdriverIO).

Type: `string|string[]`<br /> Default: `[]`

#### compilers
Use o(s) módulo(s) fornecido(s) para compilar arquivos. Os compiladores serão incluídos antes dos requisitos (opção de framework WebdriverIO).

Type: `string[]`<br /> Default: `[]`

#### allowUncaught
Propagar erros não detectados.

Type: `boolean`<br /> Default: `false`

#### bail
Fiança após falha no primeiro teste.

Type: `boolean`<br /> Default: `false`

#### checkLeaks
Verifique se há vazamentos de variáveis ​​globais.

Type: `boolean`<br /> Default: `false`

#### delay
Atrasar a execução do conjunto root.

Type: `boolean`<br /> Default: `false`

#### fgrep
Filtro de teste fornecido com a sequência de caracteres.

Type: `string`<br /> Default: `null`

#### forbidOnly
Os testes marcados como `somente` não passam no conjunto.

Type: `boolean`<br /> Default: `false`

#### forbidPending
Testes pendentes reprovam o conjunto.

Type: `boolean`<br /> Default: `false`

#### fullTrace
Rastreamento de pilha completo em caso de falha

Type: `boolean`<br /> Default: `false`

#### global
Variáveis ​​esperadas no escopo global

Type: `string[]`<br /> Default: `[]`

#### grep
Variáveis ​​esperadas no escopo global

Type: `RegExp|string`<br /> Default: `null`

#### invert
Inverter correspondências de filtro de teste

Type: `boolean`<br /> Default: `false`

#### retries
Número de vezes para repetir testes com falha.

Type: `number`<br /> Default: `0`

#### timeout
Valor limite de tempo limite (em ms)

Type: `number`<br /> Default: `30000`

## Usando Jasmim

Primeiro, instale o pacote do adaptador do NPM:

```bash npm2yarn
npm install @wdio/jasmine-framework --save-dev
```

Você pode então configurar seu ambiente Jasmine definindo uma propriedade `jasmineOpts` em sua configuração. Uma lista de todas as opções pode ser encontrada no [site do projeto Jasmine](https://jasmine.github.io/api/3.5/Configuration.html).

### Opções de Jasmim

As seguintes opções podem ser aplicadas em seu `wdio.conf.js` para configurar seu ambiente Jasmine usando a propriedade `jasmineOpts`. Para obter mais informações sobre essas opções de configuração, confira a [documentação do Jasmine](https://jasmine.github.io/api/edge/Configuration). Você pode passar essas opções de estrutura como argumentos, por exemplo:

```sh
wdio run wdio.conf.ts --jasmineOpts.grep "my test" --jasmineOpts.failSpecWithNoExpectations --no-jasmineOpts.random
```

Isso passará pelas seguintes opções de Mocha:

```ts
{
    grep: ['my-test'],
    bail: true
    checkLeacks: false
}
```

As seguintes opções do Jasmine são suportadas:

#### defaultTimeoutInterval
Intervalo de tempo limite padrão para operações Jasmine

Type: `number`<br /> Default: `60000`

#### helpers
Matriz de caminhos de arquivo (e globs) relativos a spec_dir para incluir antes das especificações do Jasmine.

Type: `string[]`<br /> Default: `[]`

#### requires
A opção `requires` é útil quando você deseja adicionar ou estender alguma funcionalidade básica.

Type: `string[]`<br /> Default: `[]`

#### random
Se deve randomizar a ordem de execução das especificações.

Type: `boolean`<br /> Default: `true`

#### seed
Seed para usar como base de randomização. Null faz com que a semente seja determinada aleatoriamente no início da execução.

Type: `Function`<br /> Default: `null`

#### failSpecWithNoExpectations
Se deve ou não ser reprovado na especificação caso ela não tenha sido executada conforme o esperado. Por padrão, uma especificação que não atendeu às expectativas é relatada como aprovada. Definir isso como verdadeiro reportará tal especificação como uma falha.

Type: `boolean`<br /> Default: `false`

#### oneFailurePerSpec
Se deve fazer com que as especificações tenham apenas uma falha de expectativa.

Type: `boolean`<br /> Default: `false`

#### specFilter
Função a ser usada para filtrar especificações.

Type: `Function`<br /> Default: `(spec) => true`

#### grep
Execute somente testes que correspondam a esta string ou regexp. (Aplicável somente se nenhuma função `specFilter` personalizada estiver definida)

Type: `string|Regexp`<br /> Default: `null`

#### invertGrep
Se verdadeiro, ele inverte os testes correspondentes e executa apenas os testes que não correspondem à expressão usada em `grep`. (Aplicável somente se nenhuma função `specFilter` personalizada estiver definida)

Type: `boolean`<br /> Default: `false`

## Usando Cucumber

Primeiro, instale o pacote do adaptador do NPM:

```bash npm2yarn
npm install @wdio/cucumber-framework --save-dev
```

Se você quiser usar o Cucumber, defina a propriedade `framework` como `cucumber` adicionando `framework: 'cucumber'` ao [arquivo de configuração](configurationfile).

Opções para o Cucumber podem ser fornecidas no arquivo de configuração com `cucumberOpts`. Confira a lista completa de opções [aqui](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options).

Para começar a usar o Cucumber rapidamente, dê uma olhada em nosso projeto [`cucumber-boilerplate`](https://github.com/webdriverio/cucumber-boilerplate) que vem com todas as definições de etapas necessárias para começar, e você estará escrevendo arquivos de recursos imediatamente.

### Opções de Cucumber

As seguintes opções podem ser aplicadas em seu `wdio.conf.js` para configurar seu ambiente Cucumber usando a propriedade `cucumberOpts`:

:::dica Ajustando opções por meio da linha de comando
Os `cucumberOpts`, como `tags` personalizados para testes de filtragem, podem ser especificados por meio da linha de comando. Isso é feito usando o formato `cucumberOpts.{optionName}="value"`.

Por exemplo, se você quiser executar apenas os testes marcados com `@smoke`, você pode usar o seguinte comando:

```sh
# Quando você deseja executar apenas testes que contenham a tag "@smoke"
npx wdio run ./wdio.conf.js --cucumberOpts.tags="@smoke"
npx wdio run ./wdio.conf.js --cucumberOpts.name="some scenario name" --cucumberOpts.failFast
```

Este comando define a opção `tags` em `cucumberOpts` como `@smoke`, garantindo que somente testes com esta tag sejam executados.

:::

#### backtrace
Mostrar rastreamento completo de erros.

Type: `Boolean`<br /> Default: `true`

#### requireModule
Exija módulos antes de solicitar quaisquer arquivos de suporte.

Type: `string[]`<br /> Default: `[]`<br /> Example:

```js
cucumberOpts: {
    requireModule: ['@babel/register']
    // or
    requireModule: [
        [
            '@babel/register',
            {
                rootMode: 'upward',
                ignore: ['node_modules']
            }
        ]
    ]
 }
 ```

#### failFast
Aborte a execução na primeira falha.

Type: `boolean`<br /> Default: `false`

#### nome
Execute somente os cenários com nome correspondente à expressão (repetível).

Type: `RegExp[]`<br /> Default: `[]`

#### require
Exija arquivos contendo suas definições de etapas antes de executar recursos. Você também pode especificar um glob para suas definições de etapas.

Type: `string[]`<br /> Default: `[]` Example:

```js
cucumberOpts: {
    require: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### import
Caminhos para onde está seu código de suporte para ESM.

Tipo: `String[]`<br /> Padrão: `[]` Exemplo:

```js
cucumberOpts: {
importar: [path.join(__dirname, 'step-definitions', 'my-steps.js')]
}
```

#### strict
Falha se houver etapas indefinidas ou pendentes.

Type: `boolean`<br /> Default: `false`

#### tags
Execute apenas os recursos ou cenários com tags que correspondam à expressão. Consulte a [documentação do Cucumber](https://docs.cucumber.io/cucumber/api/#tag-expressions) para obter mais detalhes.

Tipo: `String`<br /> Padrão: ``

#### timeout
Tempo limite em milissegundos para definições de etapas.

Tipo: `Número`<br /> Padrão: `30000`

#### retry
Especifique o número de vezes para tentar novamente os casos de teste com falha.

Tipo: `Número`<br /> Padrão: `0`

#### retryTagFilter
retryTagFilteOnly tenta novamente os recursos ou cenários com tags que correspondem à expressão (repetível).r Esta opção requer que '--retry' seja especificado.

Type: `RegExp`

#### language
Idioma padrão para seus arquivos de recursos

Tipo: `String`<br /> Padrão: `en`

#### order
Executar testes em ordem definida / aleatória

Tipo: `String`<br /> Padrão: `definido`

#### format
Nome e caminho do arquivo de saída do formatador a ser usado. O WebdriverIO oferece suporte principalmente apenas aos [Formatters](https://github.com/cucumber/cucumber-js/blob/main/docs/formatters.md) que gravam a saída em um arquivo.

Tipo: `string[]`<br />

#### formatOptions
Opções a serem fornecidas aos formatadores

Tipo: `objeto`<br />

#### tagsInTitle
Adicionar tags de cucumber ao nome do recurso ou cenário

Tipo: `Boolean`<br /> Padrão: `false`

***Observe que esta é uma opção específica do @wdio/cucumber-framework e não é reconhecida pelo próprio cucumber-js***<br/>

#### ignoreUndefinedDefinitions
Trate definições indefinidas como avisos.

Tipo: `Boolean`<br /> Padrão: `false`

***Observe que esta é uma opção específica do @wdio/cucumber-framework e não é reconhecida pelo próprio pepino-js***<br/>

#### failAmbiguousDefinitions
Trate definições ambíguas como erros.

Tipo: `Boolean`<br /> Padrão: `false`

***Observe que esta é uma opção específica do @wdio/cucumber-framework e não é reconhecida pelo próprio cucumber-js***<br/>

#### tagExpression
Execute apenas os recursos ou cenários com tags que correspondam à expressão. Consulte a [documentação do Cucumber](https://docs.cucumber.io/cucumber/api/#tag-expressions) para obter mais detalhes.

Tipo: `String`<br /> Padrão: ``

***Observe que esta opção será descontinuada no futuro. Use a propriedade de configuração [`tags`](#tags) em vez disso***

#### profile
Especifique o perfil a ser usado.

Type: `string[]`<br /> Default: `[]`

***Observe que apenas valores específicos (worldParameters, name, retryTagFilter) são suportados em perfis, pois `cucumberOpts` tem precedência. Além disso, ao usar um perfil, certifique-se de que os valores mencionados não sejam declarados em `cucumberOpts`.***

### Pular testes em cucumber

Observe que se você quiser pular um teste usando os recursos de filtragem de teste regulares do cucumber disponíveis em `cucumberOpts`, você fará isso para todos os navegadores e dispositivos configurados nos recursos. Para poder pular cenários apenas para combinações de recursos específicos sem precisar iniciar uma sessão se não for necessário, o webdriverio fornece a seguinte sintaxe de tag específica para o cucumber:

`@skip([condition])`

onde a condição é uma combinação opcional de propriedades de recursos com seus valores que, quando **todos** correspondem, fazem com que o cenário ou recurso marcado seja ignorado. É claro que você pode adicionar várias tags a cenários e recursos para pular testes em diversas condições diferentes.

Você também pode usar a anotação '@skip' para pular testes sem alterar `tagExpression'. Neste caso, os testes ignorados serão exibidos no relatório de teste.

Aqui você tem alguns exemplos dessa sintaxe:
- `@skip` ou `@skip()`: sempre pulará o item marcado
- `@skip(browserName="chrome")`: o teste não será executado em navegadores Chrome.
- `@skip(browserName="firefox";platformName="linux")`: pulará o teste nas execuções do Firefox em vez do Linux.
- `@skip(browserName=["chrome","firefox"])`: os itens marcados serão ignorados nos navegadores Chrome e Firefox.
- `@skip(browserName=/i.*explorer/)`: recursos com navegadores que correspondem ao regexp serão ignorados (como `iexplorer`, `internet explorer`, `internet-explorer`, ...).

### Import Step Definition Helper

Para usar o auxiliar de definição de etapas como `Given`, `When` ou `Then` ou hooks, você deve importar then de `@cucumber/cucumber`, por exemplo, assim:

```js
import { Given, When, Then } from '@cucumber/cucumber'
```

Agora, se você já usa o Cucumber para outros tipos de testes não relacionados ao WebdriverIO para os quais você usa uma versão específica, você precisa importar esses auxiliares em seus testes e2e do pacote WebdriverIO Cucumber, por exemplo:

```js
import { Given, When, Then, world, context } from '@wdio/cucumber-framework'
```

Isso garante que você use os auxiliares corretos dentro da estrutura do WebdriverIO e permite que você use uma versão independente do Cucumber para outros tipos de testes.

### Relatório de publicação

O Cucumber fornece um recurso para publicar seus relatórios de execução de teste em `https://reports.cucumber.io/`, que pode ser controlado definindo o sinalizador `publish` em `cucumberOpts` ou configurando a variável de ambiente `CUCUMBER_PUBLISH_TOKEN`. Entretanto, quando você usa `WebdriverIO` para execução de testes, há uma limitação com essa abordagem. Ele atualiza os relatórios separadamente para cada arquivo de recurso, dificultando a visualização de um relatório consolidado.

Para superar essa limitação, introduzimos um método baseado em promessa chamado `publishCucumberReport` em `@wdio/cucumber-framework`. Este método deve ser chamado no gancho `onComplete`, que é o local ideal para invocá-lo. `publishCucumberReport` requer a entrada do diretório de relatórios onde os relatórios de mensagens do cucumber são armazenados.

Você pode gerar relatórios de `mensagens de pepino` configurando a opção `format` em seu `cucumberOpts`. É altamente recomendável fornecer um nome de arquivo dinâmico dentro da opção de formato `cucumber message` para evitar a substituição de relatórios e garantir que cada execução de teste seja registrada com precisão.

Antes de usar esta função, certifique-se de definir as seguintes variáveis ​​de ambiente:
- CUCUMBER_PUBLISH_REPORT_URL: A URL onde você deseja publicar o relatório do Cucumber. Se não for fornecido, o URL padrão 'https://messages.cucumber.io/api/reports' será usado.
- CUCUMBER_PUBLISH_REPORT_TOKEN: O token de autorização necessário para publicar o relatório. Se este token não for definido, a função sairá sem publicar o relatório.

Aqui está um exemplo das configurações necessárias e exemplos de código para implementação:

```javascript
import { v4 as uuidv4 } from 'uuid'
import { publishCucumberReport } from '@wdio/cucumber-framework';

export const config = {
    // ... Outras opções de configuração
    cucumberOpts: {
        // ... Configuração de opções do Cucumber
formato: [
['message', `./reports/${uuidv4()}.ndjson`],
['json', './reports/test-report.json']
]
},
async onComplete() {
await publishCucumberReport('./reports');
}
}
```

Observe que `./reports/` é o diretório onde os relatórios `cucumber message` serão armazenados.

## Usando Serenity/JS

[Serenity/JS](https://serenity-js.org?pk_campaign=wdio8&pk_source=webdriver.io) é uma estrutura de código aberto projetada para tornar os testes de aceitação e regressão de sistemas de software complexos mais rápidos, mais colaborativos e mais fáceis de escalar.

Para conjuntos de testes WebdriverIO, o Serenity/JS oferece:
- [Relatórios aprimorados](https://serenity-js.org/handbook/reporting/?pk_campaign=wdio8&pk_source=webdriver.io) - Você pode usar o Serenity/JS como um substituto imediato de qualquer estrutura WebdriverIO integrada para produzir relatórios de execução de testes detalhados e documentação viva do seu projeto.
- [APIs de padrões de roteiro](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) - Para tornar seu código de teste portátil e reutilizável em projetos e equipes, o Serenity/JS oferece uma [camada de abstração](https://serenity-js.org/api/webdriverio?pk_campaign=wdio8&pk_source=webdriver.io) opcional sobre as APIs nativas do WebdriverIO.
- [Bibliotecas de integração](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io) - Para suítes de teste que seguem o Padrão de Roteiro, Serenity/JS também fornece bibliotecas de integração opcionais para ajudar você a escrever [testes de API](https://serenity-js.org/api/rest/?pk_campaign=wdio8&pk_source=webdriver.io), [gerenciar servidores locais](https://serenity-js.org/api/local-server/?pk_campaign=wdio8&pk_source=webdriver.io), [executar afirmações](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io) e muito mais!

![Exemplo de relatório BDD Serenity](/img/serenity-bdd-reporter.png)

### Instalando Serenity/JS

Para adicionar Serenity/JS a um [projeto WebdriverIO existente](https://webdriver.io/docs/gettingstarted), instale os seguintes módulos Serenity/JS do NPM:

```sh npm2yarn
npm install @serenity-js/{core,web,webdriverio,assertions,console-reporter,serenity-bdd} --save-dev
```

Saiba mais sobre os módulos Serenity/JS:
- [`@serenity-js/core`](https://serenity-js.org/api/core/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/web`](https://serenity-js.org/api/web/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/webdriverio`](https://serenity-js.org/api/webdriverio/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/assertions`](https://serenity-js.org/api/assertions/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/console-reporter`](https://serenity-js.org/api/console-reporter/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io)

### Configurando Serenity/JS

Para habilitar a integração com o Serenity/JS, configure o WebdriverIO da seguinte maneira:

<Tabs>
<TabItem value="wdio-conf-typescript" label="TypeScript" default>

```typescript title="wdio.conf.ts"
import { WebdriverIOConfig } from '@serenity-js/webdriverio';

export const config: WebdriverIOConfig = {

    // Tell WebdriverIO to use Serenity/JS framework
    framework: '@serenity-js/webdriverio',

    // Serenity/JS configuration
    serenity: {
        // Configure Serenity/JS to use the appropriate adapter for your test runner
        runner: 'cucumber',
        // runner: 'mocha',
        // runner: 'jasmine',

        // Register Serenity/JS reporting services, a.k.a. the "stage crew"
        crew: [
            // Optional, print test execution results to standard output
            '@serenity-js/console-reporter',

            // Optional, produce Serenity BDD reports and living documentation (HTML)
            '@serenity-js/serenity-bdd',
            [ '@serenity-js/core:ArtifactArchiver', { outputDirectory: 'target/site/serenity' } ],

            // Optional, automatically capture screenshots upon interaction failure
            [ '@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' } ],
        ]
    },

    // Configure your Cucumber runner
    cucumberOpts: {
        // see Cucumber configuration options below
    },


    // ... or Jasmine runner
    jasmineOpts: {
        // see Jasmine configuration options below
    },

    // ... or Mocha runner
    mochaOpts: {
        // see Mocha configuration options below
    },

    runner: 'local',

    // Any other WebdriverIO configuration
};
```

</TabItem>
<TabItem value="wdio-conf-javascript" label="JavaScript">

```typescript title="wdio.conf.js"
export const config = {

    // Tell WebdriverIO to use Serenity/JS framework
    framework: '@serenity-js/webdriverio',

    // Serenity/JS configuration
    serenity: {
        // Configure Serenity/JS to use the appropriate adapter for your test runner
        runner: 'cucumber',
        // runner: 'mocha',
        // runner: 'jasmine',

        // Register Serenity/JS reporting services, a.k.a. the "stage crew"
        crew: [
            '@serenity-js/console-reporter',
            '@serenity-js/serenity-bdd',
            [ '@serenity-js/core:ArtifactArchiver', { outputDirectory: 'target/site/serenity' } ],
            [ '@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' } ],
        ]
    },

    // Configure your Cucumber runner
    cucumberOpts: {
        // see Cucumber configuration options below
    },


    // ... or Jasmine runner
    jasmineOpts: {
        // see Jasmine configuration options below
    },

    // ... or Mocha runner
    mochaOpts: {
        // see Mocha configuration options below
    },

    runner: 'local',

    // Any other WebdriverIO configuration
};
```

</TabItem>
</Tabs>

Saiba mais sobre:
- [Opções de configuração do Serenity/JS Cucumber](https://serenity-js.org/api/cucumber-adapter/interface/CucumberConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Opções de configuração do Serenity/JS Jasmine](https://serenity-js.org/api/jasmine-adapter/interface/JasmineConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Opções de configuração do Serenity/JS Mocha](https://serenity-js.org/api/mocha-adapter/interface/MochaConfig/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Arquivo de configuração do WebdriverIO](configurationfile)

### Produzindo relatórios Serenity BDD e documentação viva

[Os relatórios e a documentação ativa do Serenity BDD](https://serenity-bdd.github.io/docs/reporting/the_serenity_reports) são gerados pelo [Serenity BDD CLI](https://github.com/serenity-bdd/serenity-core/tree/main/serenity-cli), um programa Java baixado e gerenciado pelo módulo [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io).

Para produzir relatórios do Serenity BDD, seu conjunto de testes deve:
- baixe o Serenity BDD CLI, chamando `serenity-bdd update` que armazena em cache o CLI `jar` localmente
- produzir relatórios intermediários Serenity BDD `.json`, registrando [`SerenityBDDReporter`](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io) de acordo com as [instruções de configuração](#configuring-serenityjs)
- invoque o Serenity BDD CLI quando quiser produzir o relatório, chamando `serenity-bdd run`

O padrão usado por todos os [Modelos de Projeto Serenity/JS](https://serenity-js.org/handbook/project-templates/?pk_campaign=wdio8&pk_source=webdriver.io#webdriverio) depende do uso de:
- um script NPM [`postinstall`](https://docs.npmjs.com/cli/v9/using-npm/scripts#life-cycle-operation-order) para baixar o Serenity BDD CLI
- [`npm-failsafe`](https://www.npmjs.com/package/npm-failsafe) para executar o processo de relatório mesmo se o conjunto de testes em si tiver falhado (que é exatamente quando você mais precisa de relatórios de teste...).
- [`rimraf`](https://www.npmjs.com/package/rimraf) como um método conveniente para remover quaisquer relatórios de teste restantes da execução anterior

```json title="package.json"
{
  "scripts": {
    "postinstall": "serenity-bdd update",
    "clean": "rimraf target",
    "test": "failsafe clean test:execute test:report",
    "test:execute": "wdio wdio.conf.ts",
    "test:report": "serenity-bdd run"
  }
}
```

Para saber mais sobre o `SerenityBDDReporter`, consulte:
- instruções de instalação na [`@serenity-js/serenity-bdd`](https://serenity-js.org/api/serenity-bdd/?pk_campaign=wdio8&pk_source=webdriver.io) documentação,
- exemplos de configuração em [`SerenityBDDReporter` API docs](https://serenity-js.org/api/serenity-bdd/class/SerenityBDDReporter/?pk_campaign=wdio8&pk_source=webdriver.io),
- [Exemplos de Serenity/JS no GitHub](https://github.com/serenity-js/serenity-js/tree/main/examples)

### Usando APIs de padrões de roteiro Serenity/JS

Usando APIs de padrões de roteiro SerenityO [Padrão de Roteiro](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io) é uma abordagem inovadora e centrada no usuário para escrever testes de aceitação automatizados de alta qualidade./JS Ele o orienta em direção ao uso eficaz de camadas de abstração, ajuda seus cenários de teste a capturar o vernáculo comercial do seu domínio e incentiva bons hábitos de teste e engenharia de software em sua equipe.

Por padrão, quando você registra `@serenity-js/webdriverio` como seu `framework` WebdriverIO, Serenity/JS configura um [elenco](https://serenity-js.org/api/core/class/Cast/?pk_campaign=wdio8&pk_source=webdriver.io) padrão de [atores](https://serenity-js.org/api/core/class/Actor/?pk_campaign=wdio8&pk_source=webdriver.io), onde cada ator pode:
- [`BrowseTheWebWithWebdriverIO`](https://serenity-js.org/api/webdriverio/class/BrowseTheWebWithWebdriverIO/?pk_campaign=wdio8&pk_source=webdriver.io)
- [`TakeNotes.usingAnEmptyNotepad()`](https://serenity-js.org/api/core/class/TakeNotes/?pk_campaign=wdio8&pk_source=webdriver.io)

Isso deve ser suficiente para ajudar você a começar a introduzir cenários de teste que seguem o Padrão de Roteiro, mesmo em um conjunto de testes existente, por exemplo:

```typescript title="specs/example.spec.ts"
import { actorCalled } from '@serenity-js/core'
import { Navigate, Page } from '@serenity-js/web'
import { Ensure, equals } from '@serenity-js/assertions'

describe('My awesome website', () => {
    it('can have test scenarios that follow the Screenplay Pattern', async () => {
        await actorCalled('Alice').attemptsTo(
            Navigate.to(`https://webdriver.io`),
            Ensure.that(
                Page.current().title(),
                equals(`WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO`)
            ),
        )
    })

    it('can have non-Screenplay scenarios too', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser)
            .toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
```

Para saber mais sobre o Padrão de Roteiro, confira:
- [O Padrão do Roteiro](https://serenity-js.org/handbook/design/screenplay-pattern/?pk_campaign=wdio8&pk_source=webdriver.io)
- [Testes web com Serenity/JS](https://serenity-js.org/handbook/web-testing/?pk_campaign=wdio8&pk_source=webdriver.io)
- ["BDD em Ação, Segunda Edição"](https://www.manning.com/books/bdd-in-action-second-edition)
