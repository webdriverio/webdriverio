---
id: mobile
title: Comandos Mobile
---

# Introdução aos comandos móveis personalizados e aprimorados no WebdriverIO

Testar aplicativos móveis e aplicativos da web para dispositivos móveis traz seus próprios desafios, especialmente ao lidar com diferenças específicas de plataforma entre Android e iOS. Embora o Appium ofereça flexibilidade para lidar com essas diferenças, muitas vezes ele exige que você se aprofunde em documentos complexos e dependentes de plataforma ([Android](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md), [iOS](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/)) e comandos. Isso pode tornar a escrita de scripts de teste mais demorada, propensa a erros e difícil de manter.

Para simplificar o processo, o WebdriverIO apresenta **comandos móveis personalizados e aprimorados** desenvolvidos especificamente para testes de aplicativos nativos e web móvel. Esses comandos abstraem as complexidades das APIs subjacentes do Appium, permitindo que você escreva scripts de teste concisos, intuitivos e independentes de plataforma. Ao focar na facilidade de uso, pretendemos reduzir a carga extra durante o desenvolvimento de scripts Appium e permitir que você automatize aplicativos móveis sem esforço.

## Por que comandos mobile personalizados?

### 1. **Simplificando APIs complexas**

Alguns comandos do Appium, como gestos ou interações de elementos, envolvem sintaxe detalhada e complexa. Por exemplo, executar uma ação de pressionamento longo com a API nativa do Appium requer a construção manual de uma cadeia de `ação`:

```ts
const element = $('~Contacts')

await browser
    .action( 'pointer', { parameters: { pointerType: 'touch' } })
    .move({ origin: element })
    .down()
    .pause(1500)
    .up()
    .perform()
```

Com os comandos personalizados do WebdriverIO, a mesma ação pode ser executada com uma única linha de código expressiva:

```ts
await $('~Contacts').longPress();
```

Isso reduz drasticamente o código clichê, tornando seus scripts mais limpos e fáceis de entender.

### 2. **Cross-Platform Abstraction**

Aplicativos móveis geralmente exigem manuseio específico da plataforma. Por exemplo, a rolagem em aplicativos nativos difere significativamente entre [Android](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-scrollgesture) e [iOS](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-scroll). O WebdriverIO preenche essa lacuna fornecendo comandos unificados como `scrollIntoView()` que funcionam perfeitamente em todas as plataformas, independentemente da implementação subjacente.

```ts
await $('~element').scrollIntoView();
```

Essa abstração garante que seus testes sejam portáteis e não exijam ramificações constantes ou lógica condicional para levar em conta as diferenças do sistema operacional.

### 3. **Aumento da produtividade**

Ao reduzir a necessidade de entender e implementar comandos Appium de baixo nível, os comandos móveis do WebdriverIO permitem que você se concentre em testar a funcionalidade do seu aplicativo em vez de lutar com nuances específicas da plataforma. Isso é especialmente benéfico para equipes com experiência limitada em automação móvel ou para aquelas que buscam acelerar seu ciclo de desenvolvimento.

### 4. **Consistência e Manutenibilidade**

Comandos personalizados trazem uniformidade aos seus scripts de teste. Em vez de ter implementações variadas para ações semelhantes, sua equipe pode contar com comandos padronizados e reutilizáveis. Isso não apenas torna a base de código mais fácil de manter, mas também reduz a barreira para a integração de novos membros da equipe.

## Por que aprimorar certos comandos mobile?

### 1. Adicionando flexibilidade

Certos comandos móveis são aprimorados para fornecer opções e parâmetros adicionais que não estão disponíveis nas APIs padrão do Appium. Por exemplo, o WebdriverIO adiciona lógica de nova tentativa, tempos limite e a capacidade de filtrar webviews por critérios específicos, permitindo mais controle sobre cenários complexos.

```ts
// Exemplo: Personalizando intervalos de repetição e tempos limite para detecção de webview
await driver.getContexts({
  returnDetailedContexts: true,
  androidWebviewConnectionRetryTime: 1000, // Retry every 1 second
  androidWebviewConnectTimeout: 10000,    // Timeout after 10 seconds
});
```

Essas opções ajudam a adaptar scripts de automação ao comportamento dinâmico do aplicativo sem código clichê adicional.

### 2. Melhorando a usabilidade

Comandos aprimorados abstraem complexidades e padrões repetitivos encontrados nas APIs nativas. Eles permitem que você execute mais ações com menos linhas de código, reduzindo a curva de aprendizado para novos usuários e tornando os scripts mais fáceis de ler e manter.

```ts
// Exemplo: Comando aprimorado para alternar contexto por título
context by title
await driver.switchContext({
  title: 'My Webview Title',
});
```

Em comparação com os métodos padrão do Appium, os comandos aprimorados eliminam a necessidade de etapas adicionais, como recuperar manualmente os contextos disponíveis e filtrá-los.

### 3. Padronizando Comportamento

O WebdriverIO garante que os comandos aprimorados se comportem de forma consistente em plataformas como Android e iOS. Essa abstração multiplataforma minimiza a necessidade de lógica de ramificação condicional com base no sistema operacional, resultando em scripts de teste mais fáceis de manter.

```ts
// Exemplo: comando de rolagem unificado para ambas as plataformas
await $('~element').scrollIntoView();
```

Essa padronização simplifica as bases de código, especialmente para equipes que automatizam testes em múltiplas plataformas.

### 4. Aumentando a confiabilidade

Ao incorporar mecanismos de nova tentativa, padrões inteligentes e mensagens de erro detalhadas, os comandos aprimorados reduzem a probabilidade de testes instáveis. Essas melhorias garantem que seus testes sejam resilientes a problemas como atrasos na inicialização do webview ou estados transitórios do aplicativo.

```ts
// Exemplo: alternância aprimorada de webview com lógica de correspondência robusta
await driver.switchContext({
  url: /.*my-app\/dashboard/,
  androidWebviewConnectionRetryTime: 500,
  androidWebviewConnectTimeout: 7000,
});
```

Isso torna a execução do teste mais previsível e menos propensa a falhas causadas por fatores ambientais.

### 5. Melhorando os recursos de depuração

Comandos aprimorados geralmente retornam metadados mais ricos, permitindo uma depuração mais fácil de cenários complexos, especialmente em aplicativos híbridos. Por exemplo, comandos como getContext e getContexts podem retornar informações detalhadas sobre webviews, incluindo título, URL e status de visibilidade.

```ts
// Exemplo: Recuperando metadados detalhados para depuração
const contexts = await driver.getContexts({ returnDetailedContexts: true });
console.log(contexts);
```

Esses metadados ajudam a identificar e resolver problemas mais rapidamente, melhorando a experiência geral de depuração.

Ao aprimorar os comandos móveis, o WebdriverIO não apenas torna a automação mais fácil, mas também se alinha à sua missão de fornecer aos desenvolvedores ferramentas poderosas, confiáveis ​​e intuitivas de usar.

---

## Aplicativos híbridos

Aplicativos híbridos combinam conteúdo da web com funcionalidade nativa e exigem tratamento especializado durante a automação. Esses aplicativos usam webviews para renderizar conteúdo da web em um aplicativo nativo. O WebdriverIO fornece métodos aprimorados para trabalhar com aplicativos híbridos de forma eficaz.

### Compreendendo as visualizações da web

Um webview é um componente semelhante a um navegador incorporado em um aplicativo nativo:

- **Android:** os Webviews são baseados no Chrome/System Webview e podem conter várias páginas (semelhantes às guias do navegador). Essas webviews exigem o ChromeDriver para automatizar as interações. O Appium pode determinar automaticamente a versão necessária do ChromeDriver com base na versão do System WebView ou do Chrome instalado no dispositivo e baixá-lo automaticamente se ainda não estiver disponível. Essa abordagem garante compatibilidade perfeita e minimiza a configuração manual. Consulte a [documentação do Appium UIAutomator2](https://github.com/appium/appium-uiautomator2-driver?tab=readme-ov-file#automatic-discovery-of-compatible-chromedriver) para saber como o Appium baixa automaticamente a versão correta do ChromeDriver.
- **iOS:** Webviews são alimentados pelo Safari (WebKit) e identificados por IDs genéricos como `WEBVIEW_{id}`.

### Desafios com aplicativos híbridos

1. Identificar o webview correto entre várias opções.
2. Recuperando metadados adicionais, como título, URL ou nome do pacote para melhor contexto.
3. Lidando com diferenças específicas de plataforma entre Android e iOS.
4. Alternar para o contexto correto em um aplicativo híbrido de forma confiável.

### Comandos-chave para aplicativos híbridos

#### 1. `getContext`

Recupera o contexto atual da sessão. Por padrão, ele se comporta como o método getContext do Appium, mas pode fornecer informações detalhadas de contexto quando `returnDetailedContext` está habilitado. Para mais informações, consulte [`getContext`](/docs/api/mobile/getContext)

#### 2. `getContexts`

Retorna uma lista detalhada de contextos disponíveis, aprimorando o método de contextos do Appium. Isso facilita a identificação do webview correto para interação sem chamar comandos extras para determinar o título, a URL ou o `bundleId|packageName` ativo. Para mais informações, consulte [`getContexts`](/docs/api/mobile/getContexts)

#### 3. `switchContext`

Alterna para uma visualização web específica com base no nome, título ou URL. Oferece flexibilidade adicional, como usar expressões regulares para correspondência. Para mais informações, consulte [`switchContext`](/docs/api/mobile/switchContext)

### Principais recursos para aplicativos híbridos

1. Metadados detalhados: recupere detalhes abrangentes para depuração e troca de contexto confiável.
2. Consistência entre plataformas: comportamento unificado para Android e iOS, lidando perfeitamente com peculiaridades específicas da plataforma.
3. Lógica de repetição personalizada (Android): ajuste intervalos de repetição e tempos limite para detecção de webview.

:::info Notas e Limitações

- O Android fornece metadados adicionais, como `packageName` e `webviewPageId`, enquanto o iOS se concentra em `bundleId`.
- A lógica de repetição é personalizável para Android, mas não se aplica ao iOS.
- Há vários casos em que o iOS não consegue encontrar o Webview. O Appium fornece diferentes recursos extras para o `appium-xcuitest-driver` encontrar o Webview. Se você acredita que o Webview não foi encontrado, você pode tentar definir um dos seguintes recursos:
  - `appium:includeSafariInWebviews`: adiciona contextos da web do Safari à lista de contextos disponíveis durante um teste de aplicativo nativo/webview. Isso é útil se o teste abrir o Safari e precisar interagir com ele. O padrão é `false`.
  - `appium:webviewConnectRetries`: O número máximo de tentativas antes de desistir da detecção de páginas de visualização da web. O atraso entre cada tentativa é de 500 ms, o padrão é `10` tentativas.
  - `appium:webviewConnectTimeout`: O tempo máximo em milissegundos para aguardar a detecção de uma página de visualização da web. O padrão é `5000` ms.

Para exemplos e detalhes avançados, consulte a documentação da API móvel do WebdriverIO.
:::

---

Nosso crescente conjunto de comandos reflete nosso compromisso em tornar a automação móvel acessível e elegante. Quer você esteja executando gestos complexos ou trabalhando com elementos nativos do aplicativo, esses comandos se alinham à filosofia da WebdriverIO de criar uma experiência de automação perfeita. E não vamos parar por aqui: se houver um recurso que você gostaria de ver, agradecemos seu feedback. Sinta-se à vontade para enviar suas solicitações por meio [deste link](https://github.com/webdriverio/webdriverio/issues/new/choose).
