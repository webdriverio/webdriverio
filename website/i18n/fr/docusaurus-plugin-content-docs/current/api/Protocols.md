---
id: protocols
title: Commandes de protocole
---

WebdriverIO est un cadre d'automatisation qui s'appuie sur divers protocoles d'automatisation pour contrôler un agent distant, par exemple pour un navigateur, un appareil mobile ou une télévision. En fonction de l'appareil distant, différents protocoles entrent en jeu. Ces commandes sont affectées à l'objet [Browser](/docs/api/browser) ou [Element](/docs/api/element) en fonction des informations de session par le serveur distant (par exemple, le pilote du navigateur).

En interne, WebdriverIO utilise des commandes de protocole pour presque toutes les interactions avec l'agent distant. Cependant, des commandes supplémentaires affectées à l'objet [Browser](/docs/api/browser) ou [Element](/docs/api/element) simplifient l'utilisation de WebdriverIO, par exemple, obtenir le texte d'un élément à l'aide de commandes de protocole ressemblerait à ceci :

```js
const searchInput = await browser.findElement('css selector', '#lst-ib')
await client.getElementText(searchInput['element-6066-11e4-a52e-4f735466cecf'])
```

En utilisant les commandes pratiques de l'objet [Browser](/docs/api/browser) ou [Element](/docs/api/element) , cela peut être réduit à :

```js
$('#lst-ib').getText()
```

La section suivante explique chaque protocole individuel.

## Protocole WebDriver

Le protocole [WebDriver](https://w3c.github.io/webdriver/#elements) est une norme Web pour l'automatisation du navigateur. Contrairement à certains autres outils E2E, il garantit que l'automatisation peut être effectuée sur le navigateur réel utilisé par vos utilisateurs, par exemple Firefox, Safari et Chrome et les navigateurs basés sur Chromium comme Edge, et pas seulement sur les moteurs de navigateur, par exemple WebKit, qui sont très différent.

L'avantage d'utiliser le protocole WebDriver par opposition aux protocoles de débogage comme [Chrome DevTools](https://w3c.github.io/webdriver/#elements) est que vous disposez d'un ensemble spécifique de commandes qui permettent d'interagir avec le navigateur de la même manière sur tous les navigateurs, ce qui réduit le risque de flakiness. Offre en outre à ce protocole des capacités d'évolutivité massive en utilisant des fournisseurs de cloud tels que [Sauce Labs](https://saucelabs.com/), [BrowserStack](https://www.browserstack.com/) et [autres](https://github.com/christian-bromann/awesome-selenium#cloud-services).

## Protocole WebDriver Bidi

Le protocole [WebDriver Bidi](https://w3c.github.io/webdriver-bidi/) est la deuxième génération du protocole et est actuellement en cours d'élaboration par la plupart des fournisseurs de navigateurs. Par rapport à son prédécesseur, le protocole prend en charge une communication bidirectionnelle (d'où "Bidi") entre le framework et l'appareil distant. Il introduit en outre des primitives supplémentaires pour une meilleure introspection du navigateur afin de mieux automatiser les applications Web modernes dans le navigateur.

Étant donné que ce protocole est actuellement en cours d'élaboration, d'autres fonctionnalités seront ajoutées au fil du temps et prises en charge par le navigateur. Si vous utilisez les commandes pratiques de WebdriverIOs, rien ne changera pour vous. WebdriverIO utilisera ces nouvelles fonctionnalités de protocole dès qu'elles seront disponibles et prises en charge dans le navigateur.

## Appium

Le projet [Appium](https://appium.io/) fournit des capacités pour automatiser les appareils mobiles, de bureau et tous les autres types d'appareils IoT. Alors que WebDriver se concentre sur le navigateur et le Web, la vision d'Appium est d'utiliser la même approche mais pour n'importe quel appareil arbitraire. En plus des commandes définies par WebDriver, il comporte des commandes spéciales qui sont souvent spécifiques au périphérique distant en cours d'automatisation. Pour les scénarios de test mobile, cela est idéal lorsque vous souhaitez écrire et exécuter les mêmes tests pour les applications Android et iOS.

Selon la documentation [Appium](https://appium.github.io/appium.io/docs/en/about-appium/intro/?lang=en), il a été conçu pour répondre aux besoins d'automatisation mobile selon une philosophie définie par les quatre principes suivants:

- Vous ne devriez pas avoir à recompiler votre application ou à la modifier de quelque manière que ce soit pour l'automatiser.
- Vous ne devez pas être enfermé dans un langage ou un framework spécifique pour écrire et exécuter vos tests.
- Un framework d'automatisation mobile ne devrait pas réinventer la roue en ce qui concerne les API d'automatisation.
- Un cadre d'automatisation mobile doit être open source, dans l'esprit et la pratique ainsi que dans le nom !

## Chromium

Le protocole Chromium offre un super ensemble de commandes en plus du protocole WebDriver qui n'est pris en charge que lors de l'exécution d'une session automatisée via [Chromedriver](https://chromedriver.chromium.org/chromedriver-canary).

## Firefox

Le protocole Chromium offre un super ensemble de commandes en plus du protocole WebDriver qui n'est pris en charge que lors de l'exécution d'une session automatisée via [Geckodriver](https://github.com/mozilla/geckodriver).

## Sauce Labs

Le protocole [Sauce Labs](https://saucelabs.com/) offre un super ensemble de commandes en plus du protocole WebDriver qui n'est pris en charge que lors de l'exécution d'une session automatisée à l'aide du cloud Sauce Labs.

## Selenium Standalone

Le protocole [Selenium Standalone](https://www.selenium.dev/documentation/grid/advanced_features/endpoints/) offre un super ensemble de commandes en plus du protocole WebDriver qui n'est pris en charge que lors de l'exécution d'une session automatisée à l'aide de Selenium Grid.

## JSON Wire Protocol

Le [JSON Wire Protocol](https://www.selenium.dev/documentation/legacy/json_wire_protocol/) est le pré-prédécesseur du protocole WebDriver et __obsolète__ aujourd'hui. Bien que certaines commandes puissent encore être prises en charge dans certains environnements, il n'est pas recommandé d'utiliser l'une de ses commandes.

## Mobile JSON Wire Protocol

Le [Mobile JSON Wire Protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md) est un super ensemble de commandes mobiles en plus du protocole JSON Wire. Étant donné que celui-ci est obsolète, le protocole Mobile JSON Wire Protocol a également obtenu __obsolète__. Appium peut toujours prendre en charge certaines de ses commandes, mais il n'est pas recommandé de les utiliser.
