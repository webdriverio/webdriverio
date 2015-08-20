name: configuration
category: getstarted
tags: guide
index: 2
title: WebdriverIO - Configuration
---

# Basic Configuration

If you create a WebdriverIO instance you need to define couple of options in order to set the proper
capabilities and settings. When calling the `remote` method like:

```js
var webdriverio = require('webdriverio');
var client = webdriverio.remote(options);
```

you need to pass in an object that should contain the following properties:

### desiredCapabilities
Defines the capabilities you want to run in your Selenium session. See the [Selenium documentation](https://code.google.com/p/selenium/wiki/DesiredCapabilities)
for a list of the available `capabilities`. Also useful is Sauce Labs [Automated Test Configurator](https://docs.saucelabs.com/reference/platforms-configurator/#/)
that helps you to create this object by clicking together your desired capabilities.

Type: `Object`<br>
Default: `{ browserName: 'firefox' }`<br>

**Example:**

```js
browserName: 'chrome',  // options: firefox, chrome, opera, safari
version: '27.0',        // browser version
platform: 'XP',         // OS platform
tags: ['tag1','tag2'],  // specify some tags (e.g. if you use Sauce Labs)
name: 'my test'         // set name for test (e.g. if you use Sauce Labs)
```

**Example for using Sauce Labs for mobile:**
```js
var options = {
host : ’ondemand. saucelabs .com’ ,     // connect to SauceLabs
port: 80,                               // connection port
user: ’yourusername’,                   // Username
key : ’123123123XXXX123123123 ’ ,       //Password
    desiredCapabilities : {             // you have to check at Sauce Labs, which devices and browser versions are available
        browserName : ’ Iphone ’ ,      // device, you want to connect use for your tests
        version : ’7.1 ’ ,              // OS version
        platform: ’iOS’,                // platform name
}
};
```

####desiredCapabilities for Appium
If you want to reuse your tests of WebdriverIO together with Appium for real device tests, you just need to exchange the port at the desiredCapabilities and add some options. Android tests are possible with Chrome, iOS tests with Safari, but you need the SafariLauncher to start the Safari. It need to be installed on the device and opened as a native app. It can be downloaded here : https://github.com/budhash/SafariLauncher
Appium also provides native App testing, but in this case, some App data are needed.


**Example for iOS with Safari Launcher or native app:**

```js
var options = {
    waitforTimeout: 5000,
    desiredCapabilities: {
    	platformName: 'iOS',                                // operating system
        app: 'net.company.SafariLauncher',                // bundle id of the app or safari launcher
        udid: 'asdfasdasdasdasd',                           // udid of the device
		deviceName: 'iPhone',                               // name of the device
		appiumVersion: '1.3.5'                              // currently used appium version
    },
    host: 'localhost',
    port: 4723                                              // port for Appium
};
```



**Example for Android - native App:**

```js
var options = {
    waitforTimeout: 5000,
    desiredCapabilities: {
    	platformName: 'android',                        // operating system
        app: 'net.myandroidapp.test.uniapp',            // bundle id of the app
        appActivity: 'MainActivity',                    // app activity, which should be started
        avdReadyTimeout: '1000',                        // waiting time for the app to start
        udid: 'asdfasdfasdf',                           // udid of the android device
		deviceName: 'devicexy',                         // device name
    },
    host: 'localhost',                                  // localhost
    port: 4723                                          // port for appium
};

```
**Example for Android - Chrome**

```js
var options = {
    waitforTimeout: 5000,
    desiredCapabilities: {
    	platformName: 'android',                        // operating system
    	platformVersion:'4.3',                          // OS version
        browserName: 'chrome',                          // browser
        udid: 'asdfasdfasdf',                           // udid of the android device
		deviceName: 'devicexy',                         // device name
    },
    host: 'localhost',                                  // localhost
    port: 4723                                          // port for appium
};

```




### logLevel
Level of logging verbosity.

Type: `String`<br>
Default: *silent*<br>
Options: *verbose* | *silent* | *command* | *data* | *result*

### logOutput
Pipe WebdriverIO logs into a file. You can define either a directory and WebdriverIO generates a filename for the log file
or you can pass in writeable stream and everything gets redirected to that (last one doesn't work yet with the wdio runner).

Type: `String|writeable stream`<br>
Default: *null*

### host
Host of your WebDriver server.

Type: `String`<br>
Default: *127.0.0.1*

### port
Port your WebDriver server is on.

Type: `Number`<br>
Default: *4444* 

### path
Path to WebDriver server.

Type: `String`<br>
Default: */wd/hub*

### baseUrl
Shorten `url` command calls by setting a base url. If your `url` parameter starts with `/` the base url gets prepended.

Type: `String`<br>
Default: *null*

### coloredLogs
Enables colors for log output

Type: `Boolean`<br>
Default: *true*

### screenshotPath
Saves a screenshot to a given path if Selenium driver crashes

Type: `String`|`null`<br>
Default: *null*

### waitforTimeout
Default timeout for all waitForXXX commands.

Type: `Number`<br>
Default: *500*
