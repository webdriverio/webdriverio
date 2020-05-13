---
id: multiremote
title: Multiremote
---

WebdriverIO позволяет запускать несколько сессий WebDriver/Appium в одном тесте. Это удобно, когда нужно протестировать функционал, где требуется сразу несолько пользователей (например, чат, или WebRTC приложение). Вместо того, чтобы создавать несколько удаленных инстансов, и выполнять в каждом из них одинаковые команды вроде [newSession](/docs/api/webdriver.html#newsession) или [url](/docs/api/browser/url.html), можно создать один "multiremote" инстанс и в нем контролировать сессии. Для этого используется функция `multiremote`, в которую передается объект с именованным браузером и его набором свойств. Именуя каждое свойство (capability), получится с легкостью выбирать и получать доступ к конкретному инстансу, который содержится внутри `multiremote` инстанса.

## Автономный режим

Вот пример того, как создать multiremote инстанс WebdriverIO в **автономном режиме**:

```js
import { multiremote } from 'webdriverio';

(async () => {
    const browser = await multiremote({
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    });

    // open url with both browser at the same time
    await browser.url('http://json.org');

    // click on an element at the same time
    const elem = await browser.$('#someElem');
    await elem.click();

    // only click with one browser (Firefox)
    await elem.myFirefoxBrowser.click();
})()
```

## Тест-раннер WDIO

Чтобы использовать `multiremote` с тест-раннером WDIO, в файле конфигурации `wdio.conf.js` нужно назначить `capabilities`, как объект с наименованиями браузера в виде ключей (вместо перечни capabilities):

```js
export.config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            desiredCapabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            desiredCapabilities: {
                browserName: 'firefox'
            }
        }
    }
    // ...
};
```

С такой конфигурацией будет создано две сессии вебдрайвера: с Chrome и Firefox. Не ограничиваясь браузерами, так же возможно поднять два мобильных устройства, используя [Appium](http://appium.io/). Multiremote работает с любой комбинацией ОС/браузер (например, кросс-платформа вроде смартфона + десктоп браузер). Все команды, вызванные обращением к переменной `browser`, выполняются параллельно на каждом инстансе. Это поможет упростить интеграционные тесты и немного ускорить их выполнение. К примеру, переход по ссылке:

```js
browser.url('http://chat.socket.io/');
```

Результатом каждой команды будет объект, содержащий имя браузера, как ключ, и фактического значения для него.

```js
// wdio testrunner example
browser.url('https://www.whatismybrowser.com/');

const elem = $('.string-major');
const result = elem.getText();

console.log(result.resultChrome); // returns: 'Chrome 40 on Mac OS X (Yosemite)'
console.log(result.resultFirefox); // returns: 'Firefox 35 on Mac OS X (Yosemite)'
```

Как можно заметить, команды выполняются поочередно, одна за одной. Это означает, что выполнение команды завершится, когда она отработает во всех браузерах. Это полезно в том плане, что действия браузера остаются синхронными и упрощает понимание, что происходит в данный момент.

Иногда, в тесте необходимо выполнить разные операции с каждым браузером. Например, если мы хотим протестировать чат, у нас должен быть один браузер, с которого отправляется сообщение, в то время как другой должен его получить и проверить. При использовании тест-раннера WDIO, он регистрирует имена браузеров с инстансами глобально.

```js
myChromeBrowser.$('#message').setValue('Hi, I am Chrome');
myChromeBrowser.$('#send').click();

const firefoxMessages = myFirefoxBrowser.$$('.messages')
// wait until messages arrive
firefoxMessages.waitForExist();
// check if one of the messages contain the Chrome message
assert.true(
    firefoxMessages.map((m) => m.getText()).includes('Hi, I am Chrome')
)
```

В этом примере инстанс `myFirefoxBrowser` начнет ждать, когда появится сообщение, после того, как `myChromeBrowser` нажмет на кнопку отправки. Multiremote делает управление несколькими браузерами простым и понятным, как при выполнении одинаковых действий, так и при разных.

**Заметка:** мультиремоут не предназначен для выполнения всех тестов параллельно. Он создан, чтобы облегчить управление более, чем одним браузером в особо сложных интеграционных тестах.