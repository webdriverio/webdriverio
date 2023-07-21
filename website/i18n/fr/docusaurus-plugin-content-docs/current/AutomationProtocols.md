---
id: automationProtocols
title: Protocoles d'automatisation
---

Avec WebdriverIO, vous pouvez choisir entre plusieurs technologies d'automatisation lors de l'exécution de vos tests bout en bout, localement ou dans le cloud. Par défaut, WebdriverIO recherchera toujours un pilote de navigateur conforme au protocole WebDriver sur `localhost:4444`. S'il ne trouve pas ce pilote, il utilisera Chrome DevTools en utilisant Puppeteer.

Presque tous les navigateurs modernes qui prennent en charge [WebDriver](https://w3c.github.io/webdriver/) prennent également en charge une autre interface native appelée [DevTools](https://chromedevtools.github.io/devtools-protocol/) qui peut être utilisée à des fins d'automatisation.

Les deux présentent des avantages et des inconvénients, en fonction de votre cas d'utilisation et de votre environnement.

## Protocole WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) est une interface de contrôle à distance qui permet l'introspection et le contrôle des agents utilisateurs du navigateur. Il fournit un protocole indépendant de la plate-forme et du langage comme moyen pour les programmes hors processus d'instruire à distance le comportement des navigateurs Web.

Le protocole WebDriver a été conçu pour automatiser un navigateur du point de vue de l'utilisateur, ce qui signifie que tout ce qu'un utilisateur est capable de faire, vous pouvez le faire avec le navigateur. Il fournit un ensemble de commandes qui résument les interactions courantes avec une application (par exemple, naviguer, cliquer ou lire l'état d'un élément). Puisqu'il s'agit d'un standard Web, il est bien pris en charge par tous les principaux fournisseurs de navigateurs et il est également utilisé comme protocole sous-jacent pour l'automatisation mobile à l'aide de [Appium](http://appium.io).

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

## Protocole DevTools

L'interface DevTools est une interface de navigateur native qui est généralement utilisée pour déboguer le navigateur à partir d'une application distante (par exemple, [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)). Outre ses capacités à inspecter le navigateur sous presque toutes les formes possibles, il peut également être utilisé pour le contrôler.

Alors que chaque navigateur avait sa propre interface DevTools interne qui n'était pas vraiment exposée à l'utilisateur, de plus en plus de navigateurs adoptent désormais le [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Il est utilisé soit pour déboguer une application Web à l'aide de Chrome DevTools, soit pour contrôler Chrome à l'aide d'outils tels que [Puppeteer](https://pptr.dev).

La communication se fait sans aucun proxy, directement vers le navigateur à l'aide de WebSockets :

![Configuration des outils de développement](/img/devtools.png)

WebdriverIO vous permet d'utiliser les fonctionnalités de DevTools comme technologie d'automatisation alternative pour WebDriver si vous avez des exigences particulières pour automatiser le navigateur. Avec le package [`devtools`](https://www.npmjs.com/package/devtools) NPM, vous pouvez utiliser les mêmes commandes fournies par WebDriver, qui peuvent ensuite être utilisées par WebdriverIO et le testrunner WDIO pour exécuter ses commandes utiles en plus de ce protocole. Il utilise Puppeteer en arrière-plan et vous permet d'exécuter une séquence de commandes avec Puppeteer si nécessaire.

Pour utiliser DevTools comme protocole d'automatisation, basculez l'indicateur `automationProtocol` sur `devtools` dans vos configurations ou exécutez simplement WebdriverIO sans qu'un pilote de navigateur ne s'exécute en arrière-plan.

<Tabs
  defaultValue="testrunner"
  values={[
    {label: 'Testrunner', value: 'testrunner'},
 {label: 'Standalone', value: 'standalone'},
 ]
}>
<TabItem value="testrunner">

```js title="wdio.conf.js"
export const config = {
    // ...
    automationProtocol: 'devtools'
    // ...
}
```
```js title="devtools.e2e.js"
describe('my test', () => {
    it('can use Puppeteer as automation fallback', async () => {
        // WebDriver command
        await browser.url('https://webdriver.io')

        // get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
        const puppeteer = await browser.getPuppeteer()

        // use Puppeteer interfaces
        const page = (await puppeteer.pages())[0]
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('webdriverio.png')) {
                return interceptedRequest.continue({
                    url: 'https://webdriver.io/img/puppeteer.png'
                })
            }

            interceptedRequest.continue()
        })

        // continue with WebDriver commands
        await browser.url('https://webdriver.io')

        /**
         * WebdriverIO logo is no replaced with the Puppeteer logo
         */
    })
})
```

__Note:__ there is no need to have either `selenium-standalone` or `chromedriver` services installed.

Nous vous recommandons d'encapsuler vos appels Puppeteer dans la commande `call`, afin que tous les appels soient exécutés avant que WebdriverIO ne continue avec la prochaine commande WebDriver.

</TabItem>
<TabItem value="standalone">

```js
import { remote } from 'webdriverio'

const browser = await remote({
    automationProtocol: 'devtools',
    capabilities: {
        browserName: 'chrome'
    }
})

// WebDriver command
await browser.url('https://webdriver.io')

// get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
const puppeteer = await browser.getPuppeteer()

// switch to Puppeteer to intercept requests
const page = (await puppeteer.pages())[0]
await page.setRequestInterception(true)
page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('webdriverio.png')) {
        return interceptedRequest.continue({
            url: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png'
        })
    }

    interceptedRequest.continue()
})

// continue with WebDriver commands
await browser.refresh()
await browser.pause(2000)

await browser.deleteSession()
```

</TabItem>
</Tabs>

En accédant à l'interface Puppeteer, vous avez accès à une variété de nouvelles fonctionnalités pour automatiser ou inspecter le navigateur et votre application, par exemple l'interception des requêtes réseau (voir ci-dessus), le traçage du navigateur, la limitation des capacités CPU ou réseau, et bien plus encore.

### `wdio:devtoolsOptions` Capacité

Si vous exécutez des tests WebdriverIO via le package DevTools, vous pouvez appliquer [options personnalisées de Puppeteer](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions). Ces options seront directement transmises aux méthodes [`lancement`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) ou [`connexion`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) de Puppeteer. Les autres options d'outils de développement personnalisés sont les suivantes :

#### customPort
Démarrez Chrome sur un port personnalisé.

Type: `number`<br /> Default: `9222` (default of Puppeteer)

Remarque : si vous transmettez `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` ou `wdio:devtoolsOptions/browserURL` options, WebdriverIO essaiera de se connecter avec les détails de connexion donnés plutôt que de démarrer un navigateur. Par exemple, vous pouvez vous connecter au cloud Testingbots via :

```js
import { format } from 'util'
import { remote } from 'webdriverio'

(async () => {
    const browser = await remote({
        capabilities: {
            'wdio:devtoolsOptions': {
                browserWSEndpoint: format(
                    `wss://cloud.testingbot.com?key=%s&secret=%s&browserName=chrome&browserVersion=latest`,
                    process.env.TESTINGBOT_KEY,
                    process.env.TESTINGBOT_SECRET
                )
            }
        }
    })

    await browser.url('https://webdriver.io')

    const title = await browser.getTitle()
    console.log(title) // returns "should return "WebdriverIO - click""

    await browser.deleteSession()
})()
```

### Avantages

- Accès à plus de capacités d'automatisation (ex: interception du réseau, traçage, etc.)
- Pas besoin de gérer les pilotes de navigateur

### Inconvénients

- Ne prend en charge que les navigateurs basés sur Chromium (par exemple, Chrome, Chromium Edge) et (partiellement) Firefox
- __Ne__ prend pas en charge l'exécution avec des fournisseurs de cloud comme Sauce Labs, BrowserStack, etc.
