WDIO Firefox Profile Service
============================

You want to run your Firefox browser with a specific extension or need to set couple preferences? Selenium allows you to use a profile for the Firefox browser by passing this profile as `base64` string to the `firefox_profile` property in your desired capabilities. This requires to build that profile and convert it into `base64`. This service for the [wdio testrunner](https://webdriver.io/guide/testrunner/gettingstarted.html) takes the work of compiling the profile out of your hand and let's you define your desired options comfortable from the `wdio.conf.js` file.

To find all possible options just open [about:config](about:config) in your Firefox browser or go to [mozillaZine](http://kb.mozillazine.org/About:config_entries) website to find the whole documentation about each setting. In Addition to that you can define compiled (as `*.xpi`) Firefox extensions that should get installed before the test starts.

## Installation

The easiest way is to keep `@wdio/firefox-profile-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/firefox-profile-service": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/firefox-profile-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

Setup your profile by adding the `firefox-profile` service to your service list. Then define your settings in the `firefoxProfile` property like this:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['firefox-profile'],
  firefoxProfile: {
    extensions: [
      '/path/to/extensionA.xpi', // path to .xpi file
      '/path/to/extensionB' // or path to unpacked Firefox extension
    ],
    'xpinstall.signatures.required': false,
    'browser.startup.homepage': 'https://webdriver.io',
    legacy: true // used for firefox <= 55
  },
  // ...
};
```

If you have build a custom Firefox extension that you want to install in the browser make sure to set `'xpinstall.signatures.required': false` as profile flag since Firefox extensions are required to be [signed by Mozilla](https://wiki.mozilla.org/Add-ons/Extension_Signing).

## Options

### firefoxProfile
Contains all settings as key value pair. If you want to add an extension, use the `extensions` key with an array of string paths to the extensions you want to use. If you are running a version of firefox older before 56 use `legacy: true`.

Type: `Object`
