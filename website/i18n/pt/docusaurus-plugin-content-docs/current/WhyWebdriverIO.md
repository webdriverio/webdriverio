---
id: why-webdriverio
title: Por que Webdriver.IO?
---

WebdriverIO é um framework de automatização progressivo construído para automatizar aplicativos web e móveis modernos. Ele simplifica a interação com seu aplicativo e fornece um conjunto de plugins que ajudam você a criar um conjunto de testes escalável, robusto e estável.

Foi projetado para ser:

- __Extendable__ - Adding helper functions, or more complicated sets and combinations of existing commands is __simple__ and __really useful__
- __Compatible__ - WebdriverIO can be run on the [WebDriver Protocol](https://w3c.github.io/webdriver/) for __true cross-browser testing__ as well as [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) for Chromium based automation using [Puppeteer](https://pptr.dev/).
- __Feature Rich__ - The huge variety of built-in and community plugins allows you to __easily integrate__ and __extend__ your setup to fulfill your requirements.

You can use WebdriverIO to automate:

- 🌐 <span>&nbsp;</span> __modern web applications__ written in React, Vue, Angular, Svelte or other frontend frameworks
- 📱 <span>&nbsp;</span> __hybrid__ or __native mobile applications__ running in an emulator/simulator or on a real device
- 💻 <span>&nbsp;</span> __aplicativos nativos de desktop__ (por exemplo, escritos com Electron.js)
- 📦 <span>&nbsp;</span> __testes de unidade ou componente__ de componentes web no navegador

## Baseado em Padrões Web

WebdriverIO leverages the power of the [WebDriver](https://w3c.github.io/webdriver/) and [WebDriver-BiDi](https://github.com/w3c/webdriver-bidi) protocol that is developed and supported by all browser vendors and guarantees a true cross-browser testing experience. While other automation tools require you to download modified browser engines that aren't used by actual users or emulate user behavior by injecting JavaScript, WebdriverIO relies on a common agreed standard for automation that is [properly tested](https://wpt.fyi/results/webdriver/tests?label=experimental&label=master&aligned) and ensures compatibility for decades to come.

Furthermore WebdriverIO has also support for alternative, proprietary automation protocols like [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) for debugging and introspection purposes. This allows the user to seamlessly switch between conventional commands based on WebDriver and powerful browser interactions through [Puppeteer](https://pptr.dev/).

Read more about the differences of these automation standards in the section on [Automation Protocols](automationProtocols).

## Verdadeiro Código Aberto

Compared to many automation tools in the ecosystem, WebdriverIO is a truly open source project that is run with open governance and owned by a non-profit entity called [OpenJS Foundation](https://openjsf.org/). Isto vincula juridicamente o projecto a crescer e a ser orientado no interesse de todos os participantes. A equipe do projeto valoriza a abertura e a colaboração e não é motivada por interesses monetários.

Isto torna o projecto independente na forma como está sendo desenvolvido e para onde deve ir. It allows us to provide free 24/7 support in our [community channel](https://discord.webdriver.io) as we build a sustainable community that supports and learns from each other. Lastly, it gives a lot of opportunities to the people that contribute and engage with the project due to its [open governance](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md).
