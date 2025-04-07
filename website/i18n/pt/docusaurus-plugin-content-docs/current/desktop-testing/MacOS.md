---
id: macos
title: MacOS
---

O WebdriverIO pode automatizar aplicativos MacOS arbitrários usando [Appium](https://appium.io/docs/en/2.0/). Tudo o que você precisa é do [XCode](https://developer.apple.com/xcode/) instalado no seu sistema, do Appium e do [Mac2 Driver](https://github.com/appium/appium-mac2-driver) instalados como dependência e do conjunto de recursos correto.

## Getting Started

Para iniciar um novo projeto WebdriverIO, execute:

```sh
npm create wdio@latest ./
```

Um assistente de instalação guiará você pelo processo. Certifique-se de selecionar _"Teste de desktop - de aplicativos MacOS"_ quando for perguntado que tipo de teste você gostaria de fazer. Depois, basta manter os padrões ou modificar de acordo com sua preferência.

O assistente de configuração instalará todos os pacotes Appium necessários e criará um `wdio.conf.js` ou `wdio.conf.ts` com a configuração necessária para testar no MacOS. Se você concordou em gerar automaticamente alguns arquivos de teste, você pode executar seu primeiro teste via `npm run wdio`.

<CreateMacOSProjectAnimation />

É isso aí 🎉

## Exemplo

É assim que pode ficar um teste simples que abre o aplicativo Calculadora, faz um cálculo e verifica seu resultado:

```js
describe('My Login application', () => {
    it('should set a text to a text view', async function () {
        await $('//XCUIElementTypeButton[@label="seven"]').click()
        await $('//XCUIElementTypeButton[@label="multiply"]').click()
        await $('//XCUIElementTypeButton[@label="six"]').click()
        await $('//XCUIElementTypeButton[@title="="]').click()
        await expect($('//XCUIElementTypeStaticText[@label="main display"]')).toHaveText('42')
    });
})
```

__Observação:__ o aplicativo da calculadora foi aberto automaticamente no início da sessão porque `'appium:bundleId': 'com.apple.calculator'` foi definido como opção de capacidade. Você pode alternar entre aplicativos durante a sessão a qualquer momento.

## Mais informações

Para obter informações específicas sobre testes no MacOS, recomendamos conferir o projeto [Appium Mac2 Driver](https://github.com/appium/appium-mac2-driver).
