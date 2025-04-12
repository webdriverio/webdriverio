---
id: integrate-with-app-percy
title: Para aplicativo móvel
---

## Integre seus testes WebdriverIO com o App Percy

Antes da integração, você pode explorar o tutorial de compilação de amostra do App Percy para WebdriverIO.
Integre seu conjunto de testes com o BrowserStack App Percy e aqui está uma visão geral das etapas de integração:

### Etapa 1: Crie um novo projeto de aplicativo no painel do Percy

Faça login no Percy e crie um novo projeto de tipo de aplicativo. Depois de criar o projeto, será exibida uma variável de ambiente `PERCY_TOKEN`. Percy usará o `PERCY_TOKEN` para saber para qual organização e projeto enviar as capturas de tela. Você precisará deste `PERCY_TOKEN` nas próximas etapas.

### Etapa 2: defina o token do projeto como uma variável de ambiente

Etapa 2: definir o token do projeto como uma variável de ambiente

```sh
export PERCY_TOKEN="<0>"   // macOS or Linux
$Env:PERCY_TOKEN="<0>"    // Windows PowerShell
set PERCY_TOKEN="<0>"    // Windows CMD
```

### Etapa 3: instalar pacotes Percy

Instale os componentes necessários para estabelecer o ambiente de integração para seu conjunto de testes.
Para instalar as dependências, execute o seguinte comando:

```sh
npm install --save-dev @percy/cli
```

### Etapa 4: instalar dependências

Instale o aplicativo Percy Appium

```sh
npm install --save-dev @percy/appium-app
```

### Etapa 5: Atualizar script de teste

Certifique-se de importar @percy/appium-app no ​​seu código.

Abaixo está um exemplo de teste usando a função percyScreenshot. Use esta função sempre que precisar fazer uma captura de tela.

```sh
import percyScreenshot from '@percy/appium-app';
describe('Appium webdriverio test example', function() {
  it('takes a screenshot', async () => {
    await percyScreenshot('Appium JS example');
  });
});
```

Estamos passando os argumentos necessários para o método percyScreenshot.

Os argumentos do método de captura de tela são:

```sh
percyScreenshot(driver, name[, options])
```

### Etapa 6: execute seu script de teste

Execute seus testes usando `percy app:exec`.

Se você não puder usar o comando percy app:exec ou preferir executar seus testes usando as opções de execução do IDE, você pode usar os comandos percy app:exec:start e percy app:exec:stop. Para saber mais, visite Executar Percy.

```sh
$ percy app:exec -- appium test command
```

Este comando inicia o Percy, cria uma nova compilação do Percy, tira instantâneos e os carrega no seu projeto e interrompe o Percy:

```sh
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Snapshot taken "Appium WebdriverIO Example"
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Visite as seguintes páginas para mais detalhes:

- [Integre seus testes WebdriverIO com Percy](https://www.browserstack.com/docs/app-percy/integrate/webdriverio-javascript/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- [Página de variáveis ​​de ambiente](https://www.browserstack.com/docs/app-percy/get-started/set-env-var/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- Integre usando o BrowserStack SDK se estiver usando o BrowserStack Automate.

| Recurso                                                                                                                                                                                                 | Descrição                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [Documentos oficiais](https://www.browserstack.com/docs/app-percy/integrate/webdriverio-javascript/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                 | Documentação do WebdriverIO do aplicativo Percy                                                                               |
| [Exemplo de compilação - Tutorial](https://www.browserstack.com/docs/app-percy/sample-build/webdriverio-javascript/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) | Tutorial do aplicativo Percy's WebdriverIO                                                                                    |
| [Vídeo oficial](https://youtu.be/a4I_RGFdwvc/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                                                                       | Teste visual com App Percy                                                                                                    |
| [Blog](https://www.browserstack.com/blog/product-launch-app-percy/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                                                  | Conheça o App Percy: plataforma de testes visuais automatizados com tecnologia de IA para aplicativos nativos |
