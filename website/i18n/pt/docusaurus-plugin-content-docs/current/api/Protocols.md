---
id: protocols
title: Comandos de Protocolo
---

WebdriverIO é uma estrutura de automação que depende de vários protocolos de automação para controlar um agente remoto, por exemplo, para um navegador, dispositivo móvel ou televisão. Com base no dispositivo remoto, diferentes protocolos entram em ação. Esses comandos são atribuídos ao objeto [Navegador](/docs/api/browser) ou [Elemento](/docs/api/element), dependendo das informações da sessão pelo servidor remoto (por exemplo, driver do navegador).

Internamente, o WebdriverIO usa comandos de protocolo para quase todas as interações com o agente remoto. No entanto, comandos adicionais atribuídos ao objeto [Browser](/docs/api/browser) ou [Element](/docs/api/element) simplificam o uso do WebdriverIO, por exemplo, obter o texto de um elemento usando comandos de protocolo ficaria assim:

```js
const searchInput = await browser.findElement('css selector', '#lst-ib')
await client.getElementText(searchInput['element-6066-11e4-a52e-4f735466cecf'])
```

Usando os comandos convenientes do objeto [Browser](/docs/api/browser) ou [Element](/docs/api/element), isso pode ser reduzido a:

```js
$('#lst-ib').getText()
```

A seção a seguir explica cada protocolo individual.

## Protocolo WebDriver

O protocolo [WebDriver](https://w3c.github.io/webdriver/#elements) é um padrão da web para automatizar navegadores. Ao contrário de algumas outras ferramentas E2E, ela garante que a automação pode ser feita em navegadores reais usados ​​pelos seus usuários, por exemplo, Firefox, Safari e Chrome, e navegadores baseados em Chromium como o Edge, e não apenas em mecanismos de navegador, por exemplo, WebKit, que são muito diferentes.

A vantagem de usar o protocolo WebDriver em vez de protocolos de depuração como o [Chrome DevTools](https://w3c.github.io/webdriver/#elements) é que você tem um conjunto específico de comandos que permitem interagir com o navegador da mesma maneira em todos os navegadores, o que reduz a probabilidade de instabilidade. Além disso, este protocolo oferece recursos para escalabilidade massiva usando fornecedores de nuvem como [Sauce Labs](https://saucelabs.com/), [BrowserStack](https://www.browserstack.com/) e [outros](https://github.com/christian-bromann/awesome-selenium#cloud-services).

## Protocolo Bidi WebDriver

O protocolo [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) é a segunda geração do protocolo e atualmente está sendo desenvolvido pela maioria dos fornecedores de navegadores. Comparado ao seu antecessor, o protocolo suporta uma comunicação bidirecional (daí "Bidi") entre a estrutura e o dispositivo remoto. Além disso, ele introduz primitivas adicionais para melhor introspecção do navegador para automatizar melhor os aplicativos web modernos no navegador.

Como esse protocolo está em andamento, mais recursos serão adicionados ao longo do tempo e suportados pelo navegador. Se você usar os comandos convenientes do WebdriverIO, nada mudará para você. O WebdriverIO fará uso desses novos recursos de protocolo assim que estiverem disponíveis e forem suportados no navegador.

## Appium

O projeto [Appium](https://appium.io/) fornece recursos para automatizar dispositivos móveis, de desktop e todos os outros tipos de dispositivos de IoT. Enquanto o WebDriver se concentra no navegador e na web, a visão do Appium é usar a mesma abordagem, mas para qualquer dispositivo arbitrário. Além dos comandos que o WebDriver define, ele possui comandos especiais que geralmente são específicos para o dispositivo remoto que está sendo automatizado. Para cenários de testes móveis, isso é ideal quando você deseja escrever e executar os mesmos testes para aplicativos Android e iOS.

De acordo com a [documentação](https://appium.github.io/appium.io/docs/en/about-appium/intro/?lang=en) do Appium, ele foi projetado para atender às necessidades de automação móvel de acordo com uma filosofia delineada pelos quatro princípios a seguir:

- Você não precisa recompilar seu aplicativo ou modificá-lo de nenhuma forma para automatizá-lo.
- Você não deve ficar preso a uma linguagem ou estrutura específica para escrever e executar seus testes.
- Uma estrutura de automação móvel não deve reinventar a roda quando se trata de APIs de automação.
- Uma estrutura de automação móvel deve ser de código aberto, tanto em espírito e prática quanto em nome!

## Chromium

O protocolo Chromium oferece um superconjunto de comandos além do protocolo WebDriver que só é suportado ao executar uma sessão automatizada por meio do [Chromedriver](https://chromedriver.chromium.org/chromedriver-canary) ou do [Edgedriver](https://developer.microsoft.com/fr-fr/microsoft-edge/tools/webdriver).

## Firefox

O protocolo Firefox oferece um superconjunto de comandos além do protocolo WebDriver que só é suportado ao executar sessões automatizadas por meio do [Geckodriver](https://github.com/mozilla/geckodriver).

## Sauce Labs

O protocolo [Sauce Labs](https://saucelabs.com/) oferece um superconjunto de comandos além do protocolo WebDriver que só é suportado ao executar sessões automatizadas usando a nuvem Sauce Labs.

## Selenium Standalone

O protocolo [Selenium Standalone](https://www.selenium.dev/documentation/grid/advanced_features/endpoints/) oferece um superconjunto de comandos além do protocolo WebDriver que só é suportado ao executar sessões automatizadas usando o Selenium Grid.

## JSON Wire Protocol

O [Protocolo JSON Wire](https://www.selenium.dev/documentation/legacy/json_wire_protocol/) é o antecessor do protocolo WebDriver e está __obsoleto__ hoje. Embora alguns comandos ainda possam ser suportados em certos ambientes, não é recomendado usar nenhum de seus comandos.

## Mobile JSON Wire Protocol

O [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md) é um superconjunto de comandos móveis sobre o JSON Wire Protocol. Como este foi descontinuado, o Mobile JSON Wire Protocol também foi __descontinuado__. O Appium ainda pode suportar alguns de seus comandos, mas não é recomendado usá-los.
