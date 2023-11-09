---
id: why-webdriverio
title: Perché Webdriver.IO?
---

WebdriverIO è un framework di automazione progressivo costruito per automatizzare le applicazioni web e mobile moderne. Semplifica l'interazione con la tua app e fornisce un insieme di plugin che ti aiutano a creare una suite di test scalabile, robusta e stabile.

È concepito per essere:

- __Estendibile__ - L'aggiunta di helper function, o di librerie complesse e combinazioni di comandi già presenti è __semplice__ e __davvero utile__
- __Compatibile__ - WebdriverIO può eseguire test basandosi su protocollo [WebDriver](https://w3c.github.io/webdriver/) per __veri test cross-browser__ e [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) per automazione basata su Chromium utilizzando [Puppeteer](https://pptr.dev/).
- __Ricco di Funzionalità__ - L'enorme varietà di plugin presenti in aggiunta a quelli della community consente di integrare facilmente ____ e __estendere__ la tua configurazione, per soddisfare le tue esigenze.

È possibile utilizzare WebdriverIO per automatizzare:

- 🌐 <span>&nbsp;</span> __Moderne applicazioni web__ scritte in React, Vue, Angular, Svelte o altri framework frontend
- 📱 <span>&nbsp;</span> Applicazioni mobile __ibride__ o __native__, lanciandole su simulatori/emulatori o su un device fisico
- 💻 <span>&nbsp;</span> __applicazioni desktop native__ (ad esempio scritte con Electron.js)
- 📦 <span>&nbsp;</span> __unit or component testing__ of web components in the browser

## Based on Web Standards

WebdriverIO leverages the power of the [WebDriver](https://w3c.github.io/webdriver/) and [WebDriver-BiDi](https://github.com/w3c/webdriver-bidi) protocol that is developed and supported by all browser vendors and guarantees a true cross-browser testing experience. While other automation tools require you to download modified browser engines that aren't used by actual users or emulate user behavior by injecting JavaScript, WebdriverIO relies on a common agreed standard for automation that is [properly tested](https://wpt.fyi/results/webdriver/tests?label=experimental&label=master&aligned) and ensures compatibility for decades to come.

Furthermore WebdriverIO has also support for alternative, proprietary automation protocols like [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) for debugging and introspection purposes. This allows the user to seamlessly switch between conventional commands based on WebDriver and powerful browser interactions through [Puppeteer](https://pptr.dev/).

Read more about the differences of these automation standards in the section on [Automation Protocols](automationProtocols).

## True Open Source

Compared to many automation tools in the ecosystem, WebdriverIO is a truly open source project that is run with open governance and owned by a non-profit entity called [OpenJS Foundation](https://openjsf.org/). This legally binds the project to grow and be directed in the interest of all participants. The project team values openness and collaboration and is not driven by monetary interests.

This makes the project independent in how it is being developed and where it is supposed to go. It allows us to provide free 24/7 support in our [community channel](https://discord.webdriver.io) as we build a sustainable community that supports and learns from each other. Lastly, it gives a lot of opportunities to the people that contribute and engage with the project due to its [open governance](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md).
