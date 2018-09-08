WebDriver
=========

> A lightweight, non-opinionated implementation of the [WebDriver specification](https://w3c.github.io/webdriver/webdriver-spec.html) including mobile commands supported by [Appium](http://appium.io/)

There are [tons](https://github.com/christian-bromann/awesome-selenium#javascript) of Selenium and WebDriver binding implementations in the Node.js world. Every one of them have an opinionated API and recommended way to use. This binding is the most non-opinionated you will find as it just represents the [WebDriver specification](https://w3c.github.io/webdriver/webdriver-spec.html) and doesn't come with any extra or higher level abstraction. It is lightweight and comes with support for the [WebDriver specification](https://w3c.github.io/webdriver/webdriver-spec.html) and Appiums [Mobile JSONWire Protocol](https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md).

## Example

The following example demonstrates a simple Google Search scenario:

```js
import WebDriver from 'webdriver'

;(async () => {
    const client = await WebDriver.newSession({
        path: '/',
        capabilities: { browserName: 'firefox' }
    })

    await client.navigateTo('https://www.google.com/ncr')

    const searchInput = await client.findElement('css selector', '#lst-ib')
    await client.elementSendKeys(searchInput['element-6066-11e4-a52e-4f735466cecf'], 'WebDriver')

    const searchBtn = await client.findElement('css selector', 'input[value="Google Search"]')
    await client.elementClick(searchBtn['element-6066-11e4-a52e-4f735466cecf'])

    console.log(await client.getTitle()) // outputs "WebDriver - Google Search"

    await client.deleteSession()
})()
```

# Configuration

To create a WebDriver session call the `newSession` method on the `WebDriver` class and pass in your configurations:

```js
import WebDriver from 'webdriver'
const client = await WebDriver.newSession(options)
```

The following options are available:

### capabilities
Defines the [capabilities](https://w3c.github.io/webdriver/webdriver-spec.html#capabilities) you want to run in your Selenium session.

Type: `Object`<br>
Required: `true`

### logLevel
Level of logging verbosity.

Type: `String`<br>
Default: *info*<br>
Options: *trace* | *debug* | *info* | *warn* | *error*

### logOutput
Pipe logs into a file.

Type: `String|Writable`<br>
Default: *null*

### protocol
Protocol to use when communicating with the Selenium standalone server (or driver).

Type: `String`<br>
Default: *http*
Options: *http* | *https*

### host
Host of your WebDriver server.

Type: `String`<br>
Default: *0.0.0.0*

### port
Port your WebDriver server is on.

Type: `Number`<br>
Default: *4444*

### path
Path to WebDriver server.

Type: `String`<br>
Default: */wd/hub*

### baseUrl
Shorten `url` command calls by setting a base url.

Type: `String`<br>
Default: *null*

### connectionRetryTimeout
Timeout for any request to the Selenium server.

Type: `Number`<br>
Default: *90000*

### connectionRetryCount
Count of request retries to the Selenium server.

Type: `Number`<br>
Default: *2*
