---
id: why-webdriverio
title: Pourquoi Webdriver.IO?
---

WebdriverIO est un framework d'automatisation progressif conçu pour automatiser des applications Web et mobiles modernes. Il simplifie l'interaction avec votre application et fournit un ensemble de plugins qui vous aident à créer une suite de tests évolutives, robustes et stables.

Il est conçu pour être:

- __Extensible__ - Ajout de fonctions d'assistance, ou des ensembles et combinaisons plus complexes de commandes existantes est __simple__ et __vraiment utile__
- __Compatible__ - WebdriverIO peut être exécuté sur le [Protocole WebDriver](https://w3c.github.io/webdriver/) pour __véritables essais de cross-browser__ ainsi que [Protocole Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) pour l'automatisation basée sur Chromium en utilisant [Puppeteer](https://pptr.dev/).
- __Fonctionnalité Riche__ - L'immense variété de plugins intégrés et communautaires vous permet d'intégrer __facilement__ et __d'étendre__ votre configuration pour répondre à vos exigences.

Vous pouvez utiliser WebdriverIO pour automatiser :

- 🌐 <span>&nbsp;</span> __applications web modernes__ écrites en React, Vue, Angular, Svelte ou autres frameworks en frontend
- 📱 <span>&nbsp;</span> __applications hybrides__ ou __applications mobiles natives__ exécutées dans un émulateur/simulateur ou sur un appareil réel
- 💻 <span>&nbsp;</span> __applications de bureau natives__ (par exemple, écrites avec Electron.js)
- 📦 <span>&nbsp;</span> __tests unitaires ou de composants__ de composants web dans le navigateur

## Basé sur les standards du Web

WebdriverIO tire parti de la puissance du protocole [WebDriver](https://w3c.github.io/webdriver/) et [WebDriver-BiDi](https://github.com/w3c/webdriver-bidi) qui est développé et supporté par tous les fournisseurs de navigateurs et garantit une véritable expérience de test inter-navigateurs. Alors que d'autres outils d'automatisation vous demandent de télécharger des moteurs de navigateur modifiés qui ne sont pas utilisés par les utilisateurs réels ou émuler le comportement de l'utilisateur en injectant du JavaScript, WebdriverIO repose sur un standard commun convenu pour l'automatisation qui est [correctement testé](https://wpt.fyi/results/webdriver/tests?label=experimental&label=master&aligned) et garantit la compatibilité pour les décennies à venir.

En outre, WebdriverIO supporte également des protocoles d'automatisation alternatifs et proparitaires, tels que [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) pour le débogage et l'introspection. Cela permet à l'utilisateur de basculer de façon transparente entre les commandes conventionnelles basées sur WebDriver et les interactions puissantes du navigateur via [Puppeteer](https://pptr.dev/).

En savoir plus sur les différences de ces standards d'automatisation dans la section sur [Protocoles d'automatisation](./AutomationProtocols.md).

## Vrai Open Source

Comparé à de nombreux outils d'automatisation dans l'écosystème, WebdriverIO est un projet véritablement open source géré avec une gouvernance ouverte et détenu par une entité à but non lucratif appelée [Fondation OpenJS](https://openjsf.org/). Cela lie légalement le projet à sa croissance et à son orientation dans l’intérêt de tous les participants. L’équipe du projet apprécie l’ouverture et la collaboration et n’est pas guidée par des intérêts monétaires.

Cela rend le projet indépendant quant à la manière dont il est développé et où il est censé aller. Enfin, il donne beaucoup d'opportunités aux gens qui contribuent et s'engagent avec le projet en raison de sa [gouvernance ouverte](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md). Il nous permet de fournir un soutien gratuit 24h/24 et 7j/7 sur notre [canal communautaire](https://discord.webdriver.io) alors que nous construisons une communauté durable qui se soutient et apprend les uns des autres.
