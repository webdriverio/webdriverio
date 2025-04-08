---
id: file-download
title: Baixar arquivo
---

Ao automatizar downloads de arquivos em testes web, é essencial lidar com eles de forma consistente em diferentes navegadores para garantir uma execução confiável do teste.

Aqui, fornecemos as melhores práticas para downloads de arquivos e demonstramos como configurar diretórios de download para **Google Chrome**, **Mozilla Firefox** e **Microsoft Edge**.

## Baixar Paths

**A codificação** de caminhos de download em scripts de teste pode levar a problemas de manutenção e portabilidade. Utilize **caminhos relativos** para diretórios de download para garantir portabilidade e compatibilidade entre diferentes ambientes.

```javascript
// 👎
// Caminho de download codificado
const downloadPath = '/caminho/para/downloads';

// 👍
// Caminho de download relativo
const downloadPath = path.join(__dirname, 'downloads');
```

## Estratégias de espera

Deixar de implementar estratégias de espera adequadas pode levar a condições de corrida ou testes não confiáveis, especialmente para conclusão de download. Implemente estratégias de espera **explícitas** para aguardar a conclusão dos downloads de arquivos, garantindo a sincronização entre as etapas do teste.

```javascript
// 👎
// Nenhuma espera explícita para conclusão do download
await browser.pause(5000);

// 👍
// Aguarde a conclusão do download do arquivo
await waitUntil(async ()=> await fs.existsSync(downloadPath), 5000);
```

## Configurando diretórios de download

Para substituir o comportamento de download de arquivos para **Google Chrome**, **Mozilla Firefox** e **Microsoft Edge**, forneça o diretório de download nos recursos do WebDriverIO:

<Tabs>

<TabItem value='chrome'>

```javascript reference title="wdio.conf.js"
https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L8-L16
```

</TabItem>

<TabItem value='firefox'>

```javascript reference title="wdio.conf.js"
https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L20-L32
```

</TabItem>

<TabItem value='edge'>

```javascript reference title="wdio.conf.js"
https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L36-L44
```

</TabItem>

</Tabs>

Para um exemplo de implementação, consulte a [Receita de comportamento de download de teste do WebdriverIO](https://github.com/webdriverio/example-recipes/tree/main/testDownloadBehavior).

## Configurando downloads do navegador Chromium

Para alterar o caminho de download para navegadores **baseados em Chromium** (como Chrome, Edge, Brave, etc.) usando o método `getPuppeteer` do WebDriverIO para acessar o Chrome DevTools.

```javascript
const page = await browser.getPuppeteer();
// Iniciar uma sessão CDP:
const cdpSession = await page.target().createCDPSession();
// Definir o caminho de download:
await cdpSession.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });
```

## Lidando com downloads de vários arquivos

Ao lidar com cenários que envolvem downloads de vários arquivos, é essencial implementar estratégias para gerenciar e validar cada download de forma eficaz. Considere as seguintes abordagens:

**Manuseio de download sequencial:** Baixe os arquivos um por um e verifique cada download antes de iniciar o próximo para garantir a execução ordenada e a validação precisa.

**Manipulação de downloads paralelos:** Utilize técnicas de programação assíncrona para iniciar vários downloads de arquivos simultaneamente, otimizando o tempo de execução do teste. Implemente mecanismos de validação robustos para verificar todos os downloads após a conclusão.

## Considerações sobre compatibilidade entre navegadores

Embora o WebDriverIO forneça uma interface unificada para automação do navegador, é essencial levar em conta as variações no comportamento e nos recursos do navegador. Considere testar a funcionalidade de download de arquivos em diferentes navegadores para garantir compatibilidade e consistência.

**Configurações específicas do navegador:** Ajuste as configurações do caminho de download e as estratégias de espera para acomodar as diferenças no comportamento e nas preferências do navegador no Chrome, Firefox, Edge e outros navegadores compatíveis.

**Compatibilidade com versões do navegador:** Atualize regularmente as versões do seu WebDriverIO e do navegador para aproveitar os recursos e aprimoramentos mais recentes, garantindo a compatibilidade com seu conjunto de testes existente.
