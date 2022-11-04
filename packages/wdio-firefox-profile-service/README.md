WDIO Firefox Profile Service
============================

You want to run your Firefox browser with a specific extension or need to set couple preferences? Selenium allows you to use a profile for the Firefox browser by passing this profile as `base64` string to the `firefox_profile` property in your desired capabilities. This requires building that profile and converting it into `base64`. This service for the [wdio testrunner](https://webdriver.io/docs/clioptions) takes the work of compiling the profile out of your hand and lets you define your desired options comfortably from the `wdio.conf.js` file.

To find all possible options open [about:config](about:config) in your Firefox browser or go to [mozillaZine](http://kb.mozillazine.org/About:config_entries) website to find the whole documentation about each setting. In Addition to that, you can define compiled (as `*.xpi`) Firefox extensions that should get installed before the test starts.

## Installation

The easiest way is to keep `@wdio/firefox-profile-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/firefox-profile-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

Setup your profile by adding the `firefox-profile` service to your service list. Then define your settings in the `firefoxProfile` property like this:

```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['firefox-profile', {
            extensions: [
                '/path/to/extensionA.xpi', // path to .xpi file
                '/path/to/extensionB' // or path to unpacked Firefox extension
            ],
            'xpinstall.signatures.required': false,
            'browser.startup.homepage': 'https://webdriver.io',
            legacy: true // only use for firefox <= 55
        }]
    ],
    // ...
};
```

If you have built a custom Firefox extension that you want to install in the browser make sure to set `'xpinstall.signatures.required': `false` as a profile flag since Firefox extensions are required to be [signed by Mozilla](https://wiki.mozilla.org/Add-ons/Extension_Signing).

To use custom unsigned extensions you will also need to use [Firefox Developer Edition](https://www.mozilla.org/en-GB/firefox/developer/) since the regular Firefox 48 and newer [do not allow this](https://wiki.mozilla.org/Add-ons/Extension_Signing#Timeline).

## Options

Contains all settings as key-value pair. You can find all available settings on the `about:config` page.

### extensions

Add one or multiple extensions to the browser session. All entries can be either an absolute path to the `.xpi` file or the path to an unpacked Firefox extension directory.

Type: `String[]`<br />
Default: `[]`

### profileDirectory

Create Firefox profile based on an existing one by setting an absolute path to that profile.

Type: `String`<br />
Default: `null`

### proxy

Set network proxy settings. The parameter `proxy` is a hash whose structure depends on the value of the mandatory `proxyType` key, which takes one of the following string values:

 * `direct` - direct connection (no proxy)
 * `system` - use operating system proxy settings
 * `pac` - use an automatic proxy configuration set based on the value of `autoconfigUrl` key
 * `manual` - manual proxy settings defined separately for different protocols using values from the following keys: `ftpProxy`, `httpProxy`, `sslProxy`, `socksProxy`

Type: `Object`<br />
Default: `null`<br />
Example:

- Automatic Proxy:
    ```js
    // wdio.conf.js
    export const config = {
        // ...
        services: [
            ['firefox-profile', {
                proxy: {
                    proxyType: 'pac',
                    autoconfigUrl: 'http://myserver/proxy.pac'
                }
            }]
        ],
        // ...
    };
    ```

- Manual HTTP Proxy:
    ```js
    // wdio.conf.js
    export const config = {
        // ...
        services: [
            ['firefox-profile', {
                proxy: {
                    proxyType: 'manual',
                    httpProxy: '127.0.0.1:8080'
                }
            }]
        ],
        // ...
    };
    ```

- Manual HTTP and HTTPS Proxy:
    ```js
    // wdio.conf.js
    export const config = {
        // ...
        services: [
            ['firefox-profile', {
                proxy: {
                    proxyType: 'manual',
                    httpProxy: '127.0.0.1:8080',
                    sslProxy: '127.0.0.1:8080'
                }
            }]
        ],
        // ...
    };
    ```

### legacy

Please set this flag to `true` if you use Firefox v55 or lower.

Type: `Boolean`<br />
Default: `false`

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
