---
id: automationProtocols
title: Protocoles d'automatisation
---

Avec WebdriverIO, vous pouvez choisir entre plusieurs technologies d'automatisation lors de l'exécution de vos tests bout en bout, localement ou dans le cloud. By default, WebdriverIO will attempt to start a local automation session using the [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) protocol.

## WebDriver Bidi Protocol

The [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) is an automation protocol to automate browsers using bi-directional communication. It's the successor of the [WebDriver](https://w3c.github.io/webdriver/) protocol and enables a lot more introspection capabilities for various testing use cases.

This protocol is currently under development and new primitives might be added in the future. All browser vendors have committed to implementing this web standard and a lot of [primitives](https://wpt.fyi/results/webdriver/tests/bidi?label=experimental&label=master&aligned) have already been landed in browsers.

## Protocole WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) est une interface de contrôle à distance qui permet l'introspection et le contrôle des agents utilisateurs du navigateur. Il fournit un protocole indépendant de la plate-forme et du langage comme moyen pour les programmes hors processus d'instruire à distance le comportement des navigateurs Web.

Le protocole WebDriver a été conçu pour automatiser un navigateur du point de vue de l'utilisateur, ce qui signifie que tout ce qu'un utilisateur est capable de faire, vous pouvez le faire avec le navigateur. Il fournit un ensemble de commandes qui résument les interactions courantes avec une application (par exemple, naviguer, cliquer ou lire l'état d'un élément). Since it is a web standard, it is well supported across all major browser vendors and also is being used as an underlying protocol for mobile automation using [Appium](http://appium.io).

Pour utiliser ce protocole d'automatisation, vous avez besoin d'un serveur proxy qui traduit toutes les commandes et les exécute dans l'environnement cible (c'est-à-dire le navigateur ou l'application mobile).

Pour l'automatisation du navigateur, le serveur proxy est généralement le pilote du navigateur. Il existe des pilotes disponibles pour tous les navigateurs :

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Pour tout type d'automatisation mobile, vous devrez installer et configurer [Appium](http://appium.io). Il vous permettra d'automatiser des applications mobiles (iOS/Android) ou même de bureau (macOS/Windows) en utilisant la même configuration WebdriverIO.

Il existe également de nombreux services qui vous permettent d'exécuter votre test d'automatisation dans le cloud à grande échelle. Au lieu d'avoir à configurer tous ces pilotes localement, vous pouvez simplement parler à ces services (par exemple [Sauce Labs](https://saucelabs.com)) dans le cloud et inspecter les résultats sur leur plate-forme. La communication entre le script de test et l'environnement d'automatisation se présentera comme suit :

![Configuration du pilote Web](/img/webdriver.png)

### Avantages

- Norme Web officielle du W3C, prise en charge par tous les principaux navigateurs
- Protocole simplifié qui couvre les interactions courantes des utilisateurs
- Prise en charge de l'automatisation mobile (et même des applications de bureau natives)
- Peut être utilisé localement ainsi que dans le cloud grâce à des services tels que [Sauce Labs](https://saucelabs.com)

### Inconvénients

- Non conçu pour une analyse approfondie du navigateur (par exemple, le traçage ou l'interception d'événements réseau)
- Ensemble limité de capacités d'automatisation (par exemple, pas de prise en charge de la limitation du processeur ou du réseau)
- Effort supplémentaire pour configurer le pilote du navigateur avec selenium-standalone/chromedriver/etc
