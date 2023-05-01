---
id: automationProtocols
title: Протоколи автоматизації
---

З WebdriverIO ви можете обирати між кількома технологіями автоматизації для виконання E2E тестів локально або у хмарі. За замовчуванням WebdriverIO завжди перевірятиме наявність WebDriver сервера за адресою `localhost:4444`. Якщо такий сервер не буде знайдено, то буде запущена автоматизація за допомогою Chrome DevTools протоколу використовуючи Puppeteer під капотом.

Майже всі сучасні браузери, які підтримують [WebDriver](https://w3c.github.io/webdriver/), також підтримують й інший інтерфейс під назвою [DevTools](https://chromedevtools.github.io/devtools-protocol/), який можна використовувати для автоматизації браузера.

Обидва мають переваги та недоліки, залежно від вашого випадку використання та середовища.

## WebDriver протокол

> [WebDriver](https://w3c.github.io/webdriver/) — це інтерфейс дистанційного керування, який дозволяє переглядати та контролювати віддалений браузер. Протокол декларує не пов'язаний із мовою та платформою інтерфейс як спосіб для позапроцесних програм дистанційно керувати поведінкою браузерів.

Протокол WebDriver розроблено для автоматизації браузера, щоб симулювати поведінку користувача, тобто все, що може робити користувач, ви можете автоматизувати у браузері. Надається набір стандартних команд, які абстрагують типові взаємодії з програмою (наприклад, навігація, клацання, або зчитування стану елемента). Оскільки це вебстандарт, він добре підтримується всіма основними розробниками браузерів, а також використовується як базовий протокол для мобільної автоматизації за допомогою [Appium](http://appium.io).

Щоб використовувати цей протокол автоматизації, вам потрібен проксі-сервер, який перекладає всі команди та виконує їх у цільовому середовищі (тобто у браузері чи мобільному додатку).

Для автоматизації браузера проксі-сервер зазвичай є драйвером браузера. Доступні драйвери для всіх браузерів:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Для будь-якого типу мобільної автоматизації вам потрібно буде встановити та налаштувати [Appium](http://appium.io). Це дозволить вам автоматизувати мобільні (iOS/Android) або навіть настільні (macOS/Windows) програми, використовуючи ту саму конфігурацію із WebdriverIO.

Існує також багато сервісів, які надають послуги із запуску автоматизований тест у хмарі. Замість того, щоб налаштовувати всі ці драйвери локально, ви можете просто комунікувати із цим сервісами (наприклад [Sauce Labs](https://saucelabs.com)) у хмарі та перевіряти бачити результати на їхній платформі. Комунікація між тестом і середовищем автоматизації виглядатиме так:

![Налаштування WebDriver](/img/webdriver.png)

### Переваги

- Офіційний веб-стандарт W3C, який підтримується всіма основними браузерами
- Спрощений протокол, який охоплює розповсюджені користувацькі дії
- Підтримка мобільної автоматизації (і навіть настільних програм)
- Можна використовувати як локально, так і в хмарі за допомогою таких служб, як [Sauce Labs](https://saucelabs.com)

### Недоліки

- Не призначений для поглибленого аналізу браузера (наприклад, відстеження або перехоплення мережевих подій)
- Обмежений набір можливостей автоматизації (наприклад, відсутність підтримки сповільнення ЦП або мережі)
- Потребує додаткових зусиль для налаштування драйвера браузера із selenium-standalone/chromedriver/і т.п.

## DevTools протокол

DevTools — це інтерфейс браузера, який зазвичай використовується для віддаленого налагодження браузера за допомогою іншої програми (наприклад, [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)). Окрім його можливостей переглядати вміст браузера майже у всіх можливих формах, його також можна використовувати для керування браузером.

Раніше кожен браузер мав власний внутрішній інтерфейс DevTools, який насправді не був доступний користувачеві, але зараз все більше браузерів використовують [Chrome DevTools протокол](https://chromedevtools.github.io/devtools-protocol/). Цей протокол використовується або для налагодження веб застосунку за допомогою Chrome DevTools, або для керування Chrome за допомогою таких інструментів, як от [Puppeteer](https://pptr.dev).

Зв'язок відбувається без жодного проксі-сервера, безпосередньо із браузером за допомогою WebSockets:

![Налаштування DevTools](/img/devtools.png)

WebdriverIO дозволяє використовувати можливості DevTools як альтернативну технологію автоматизації для WebDriver, якщо у вас є особливі вимоги до автоматизації браузера. З NPM пакунком [`devtools`](https://www.npmjs.com/package/devtools) ви можете викликати ті ж самі команди, які надає WebDriver, які потім можуть бути використані WebdriverIO та WDIO testrunner для запуску своїх корисних команд із цим протоколом. Пакунок використовує Puppeteer під капотом і тому надає можливість запускати також і команди безпосередньо із Puppeteer, якщо в цьому виникає потреба.

Щоб використовувати DevTools як протокол автоматизації, змініть значення `automationProtocol` на `devtools` у своїй конфігурації або просто запустіть WebdriverIO без драйвера браузера запущеного у фоновому режимі.

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

Ми рекомендуємо обернути ваші виклики Puppeteer у команду `call`, щоб усі виклики були виконані до того, як WebdriverIO продовжить виконання наступної команди WebDriver.

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

Отримавши доступ до інтерфейсу Puppeteer, ви отримуєте доступ до ряду нових можливостей для автоматизації або перегляду браузера та вашої веб сторінки, наприклад, перехоплення мережевих запитів (див. вище), відстеження навігації, уповільнення ЦП або мережі й багато іншого.

### Параметр `wdio:devtoolsOptions`

Якщо ви запускаєте тести WebdriverIO через із DevTools протоколом, ви можете застосувати [спеціальні параметри Puppeteer](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions). Ці параметри будуть безпосередньо передані в методи [`launch`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) або [`connect`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) з Puppeteer. Інші параметри devtools:

#### customPort
Запустіть Chrome на вказаному порті.

Type: `number`<br /> Default: `9222` (default of Puppeteer)

Примітка: якщо ви передаєте параметри `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` або `wdio:devtoolsOptions/browserURL`, WebdriverIO намагатиметься з’єднатися із браузером використовуючи надану інформацію, замість запуску браузера. Наприклад, ви можете підключитися до хмари Testingbots використовуючи:

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

### Переваги

- Доступ до додаткових можливостей автоматизації (наприклад, перехоплення мережевих запитів, відстеження тощо)
- Нема потреби у драйверах браузера

### Недоліки

- Підтримує лише браузер на основі Chromium (наприклад, Chrome, Chromium Edge) і (частково) Firefox
- __Не__ підтримується хмарними сервісами, такими як Sauce Labs, BrowserStack тощо.
