---
id: browser-logs
title: Registros do navegador
---

Ao executar testes, o navegador pode registrar informações importantes nas quais você está interessado ou deseja se basear.

<0>

<TabItem value='bidi'>

Ao usar o WebDriver Bidi, que é a maneira padrão como o WebdriverIO automatiza o navegador, você pode assinar eventos provenientes do navegador. Para eventos de log que você deseja escutar em `log.entryAdded'`, por exemplo:

```ts
await browser.sessionSubscribe({ events: ['log.entryAdded'] })

/**
 * retorna: {"type":"console","method":"log","realm":null,"args":[{"type":"string","value":"Hello Bidi"}],"level":"info","text":"Hello Bidi","timestamp":1657282076037}
 */
browser.on('log.entryAdded', (entryAdded) => console.log('received %s', entryAdded))
```

Em um teste, você pode simplesmente enviar eventos de log para um array e afirmar esse array quando sua ação for concluída, por exemplo:

```ts
import type { local } from 'webdriver'

describe('deve registrar ao fazer uma determinada ação', () => {
const logs: string[] = []

function logEvents (event: local.LogEntry) {
logs.push(event.text) // adiciona mensagem de log ao array
}

before(async () => {
await browser.sessionSubscribe({ events: ['log.entryAdded'] })
browser.on('log.entryAdded', logEvents)
})

it('deve disparar o evento do console', () => {
// dispara o navegador envia uma mensagem para o console
...

// afirma se o log foi capturado
expect(logs).toContain('Hello Bidi')
})

// limpa o listener depois
after(() => {
browser.off('log.entryAdded', logEvents)
})
})
```

</TabItem>

<TabItem value='classic'>

Se você ainda usa o WebDriver Classic ou desabilitou o uso do Bidi por meio do recurso `'wdio:enforceWebDriverClassic': true`, você pode usar o comando JSONWire `getLogs` para buscar os logs mais recentes. Como o WebdriverIO removeu esses comandos obsoletos, você terá que usar o [Serviço JSONWP](https://github.com/webdriverio-community/wdio-jsonwp-service) para adicionar o comando de volta à instância do seu navegador.

Depois de adicionar ou iniciar o serviço, você pode obter logs via:

```ts
const logs = await browser.getLogs('browser')
const logMessage = logs.find((log) => log.message.includes('Olá Bidi'))
expect(logMessage).toBeTruthy()
```

Observação: o comando `getLogs` só pode buscar os logs mais recentes do navegador. Eventualmente, ele pode limpar mensagens de log caso elas se tornem muito antigas.
</0>

</Tabs>

Observe que você pode usar esse método para recuperar mensagens de erro e verificar se seu aplicativo encontrou algum erro.
