---
id: automationProtocols
title: Automation Protocols
---

С помощью WebdriverIO вы можете выбирать из нескольких технологий автоматизации при запуске своих E2E тестов локально или в облаке. По умолчанию WebdriverIO всегда проверяет наличие драйвера браузера, совместимого с протоколом WebDriver, на `localhost:4444`. Если не удается найти такой драйвер, то используется Chrome DevTools с использованием Puppeteer.

Почти все современные браузеры, поддерживающие [WebDriver](https://w3c.github.io/webdriver/), также поддерживают [DevTools](https://chromedevtools.github.io/devtools-protocol/) - еще один нативный интерфейс, который может использоваться для автоматизации.

Оба протокола имеют преимущества и недостатки, в зависимости от вашего варианта использования и окружения.

## Протокол WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) - это интерфейс удаленного управления браузером, который позволяет получать информацию о нем и управлять его действиями через программный интерфейс. Он предоставляет независимый от платформы и языка протокол, позволяющий внешним программам удаленно управлять поведением веб-браузеров.

Протокол WebDriver был разработан для автоматизации браузера с точки зрения пользователя, что означает, что все, что пользователь может сделать в браузере, можно сделать и при помощи автоматизации. WebDriver предоставляет набор команд, которые абстрагируют общие взаимодействия с приложением (например, навигация, клики или чтение состояния элемента). Поскольку это веб-стандарт, он хорошо поддерживается всеми основными поставщиками браузеров, а также используется в качестве базового протокола для мобильной автоматизации с использованием [Appium](http://appium.io).

Чтобы использовать этот протокол автоматизации, нужен прокси-сервер, который переводит все команды и выполняет их в целевой среде (то есть в браузере или мобильном приложении).

Для автоматизации браузера прокси-сервером обычно является драйвер браузера. Драйвера доступны для всех браузеров:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Для любого вида мобильной автоматизации вам потребуется установить и настроить [Appium](http://appium.io). Это позволит вам автоматизировать мобильные (iOS/Android) или даже настольные (macOS/Windows) приложения, используя ту же настройку WebdriverIO.

Также существует множество сервисов, позволяющих запускать ваши тесты в облаке и у вас будет возможность быстрой масштабируемости. Вместо того чтобы устанавливать все эти драйверы локально, вы можете просто обратиться к этим службам (например [Sauce Labs](https://saucelabs.com)) в облаке и проверить результаты на их платформе. Общение между тестами и средой автоматизации будет выглядеть следующим образом:

![Настройка веб-драйвера](/img/webdriver.png)

### Преимущества

- Официальный веб-стандарт W3C, поддерживаемый всеми основными браузерами
- Упрощенный протокол, который охватывает все действия пользователя
- Поддержка мобильной автоматизации (и даже настольных приложений)
- Может использоваться как локально, так и в облаке с помощью сервисов, как [Sauce Labs](https://saucelabs.com)

### Недостатки

- Не предназначен для углубленного анализа браузера (например, отслеживания или перехвата сетевых событий)
- Набор возможностей автоматизации ограничен (например, отсутствие поддержки для тротллинга ЦП или сети)
- Дополнительные усилия по установке драйвера браузера с помощью selenium-standalone/chromedriver/etc

## DevTools Protocol

Интерфейс DevTools - это нативный интерфейс браузера, который обычно используется для отладки браузера из удаленного приложения (например, [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)). Помимо возможности отладки браузера в разных формах, DevTools также может использоваться для его управления.

Хотя раньше у каждого браузера был свой собственный внутренний интерфейс DevTools, который на самом деле не был доступен пользователю, сейчас все больше и больше браузеров используют протокол [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/). Он используется либо для отладки веб-приложения с помощью Chrome DevTools, либо для управления Chrome с помощью таких инструментов, как [Puppeteer](https://pptr.dev).

Общение происходит без прокси, непосредственно в браузер с помощью WebSockets:

![Настройка DevTools](/img/devtools.png)

WebdriverIO позволяет использовать возможности DevTools в качестве альтернативной технологии автоматизации WebDriver, если у вас есть специальные требования для автоматизации браузера. С помощью пакета NPM [`devtools`](https://www.npmjs.com/package/devtools) мы можем использовать те же команды, что и WebDriver, которые затем могут быть использованы WebdriverIO и тест-раннером WDIO для выполнения команд поверх этого протокола. Он использует Puppeteer под капотом и позволяет запускать последовательность команд с помощью Puppeteer.

Чтобы использовать DevTools в качестве вашего протокола автоматизации переключите флаг `automationProtocol` на `devtools` в своих конфигурациях или запустите WebdriverIO без драйвера браузера в фоновом режиме.

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

Мы рекомендуем заключать ваши вызовы Puppeteer в команду call, чтобы все вызовы выполнялись до того, как WebdriverIO продолжит выполнение следующей команды WebDriver.

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

Обращаясь к интерфейсу Puppeteer, у вас есть доступ к различным новым возможностям для автоматизации или проверки браузера и вашего приложения, например, перехватывание сетевых запросов (см. выше), трассировка браузера, замедление процессора или сетевых возможностей и многое другое.

### `wdio:devtoolsOptions` Capability

Если вы запускаете тесты WebdriverIO через пакет DevTools, вы можете использовать [кастомные параметры Puppeteer-а](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions). Эти параметры будут напрямую переданы в методы [` launch `](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) или [` connect `](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) Puppeteer. Другие пользовательские параметры devtools:

#### customPort
Запустить Chrome на другом порту.

Type: `number`<br /> Default: `9222` (default of Puppeteer)

Примечание: если вы передаете параметры `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` или `wdio:devtoolsOptions/browserURL`, то WebdriverIO попытается подключиться с использованием указанных параметров соединения вместо запуска браузера. Например, вы можете подключиться к облаку Testingbots через:

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

### Преимущества

- Доступ к дополнительным возможностям автоматизации (например, перехват передачи данных, отслеживание и т. д.)
- Нет необходимости настраивать драйверы браузеров

### Недостатки

- Поддерживает только браузеры на основе Chromium (например, Chrome, Chromium Edge) и (частично) Firefox
- __Не__ поддерживается выполнение тестов в облачных сервисах, например, таких как Sauce Labs, BrowserStack и т. д.
