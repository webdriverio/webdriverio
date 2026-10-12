WebdriverIO Video Reporter
==========================

<p align="center">
  <img width="100%" src="https://media.giphy.com/media/7Fgle7bHGrxR3zY6Gw/giphy.gif" />
</p>

> Create a video screen capture of your tests and enhanced your Allure reporting easily!

This is a [WebdriverIO](https://webdriver.io/) reporter that generates videos of your test executions. If you use it in combination with the [Allure Reporter](https://webdriver.io/docs/allure-reporter), then the test cases automatically get decorated with the videos as well (see [example project](https://presidenten.github.io/wdio-video-reporter-example-report/)).

As this reporter is using the WebDriver screenshot command ([`takeScreenshot`](https://webdriver.io/docs/api/webdriver#takescreenshot)) to render the video it supports all environments including mobile environments.

In a WebDriver BiDi session, some commands use WebDriver BiDi instead of a WebDriver endpoint: `url` (with an `http` or `https` URL), `back`, `forward`, `refresh` and `actions`. The reporter also takes a frame for these commands. `execute` in a BiDi session gives no frame (WebdriverIO also uses the same BiDi command inside many other commands).

In a multi-remote session, the reporter records the first browser instance.

That said, taking a screenshot after almost every command can slow down your tests. Also, note that the videos don't include alert-boxes and popups.

# Installation

First, install the reporter:

```sh
npm install @wdio/video-reporter --save-dev
```

Then add the reporter to your configuration:

```js
 reporters: [
    ['video', {
      saveAllVideos: false,       // If true, also saves videos for successful test cases
      videoSlowdownMultiplier: 3, // Higher to get slower videos, lower for faster videos [Value 1-100]
    }],
  ],
```

# Usage

## With [Allure Reporter](https://webdriver.io/docs/allure-reporter)

Adding the Allure reporter as well automatically updates the reports with videos without any need to configure anything :-)

```js
 reporters: [
    ['video', {
      saveAllVideos: false,       // If true, also saves videos for successful test cases
      videoSlowdownMultiplier: 3, // Higher to get slower videos, lower for faster videos [Value 1-100]
    }],
    ['allure', {
      outputDir: './_results_/allure-raw',
      disableWebdriverStepsReporting: true,
      disableWebdriverScreenshotsReporting: true,
    }],
  ],
```

## With [`@wdio/html-reporter`](https://webdriver.io/docs/html-reporter)

The HTML reporter adds the videos to its report without more configuration. Use the same `outputDir` for both
reporters:

```js
 reporters: [
    ['video', {
      saveAllVideos: false,       // If true, also saves videos for successful test cases
      videoSlowdownMultiplier: 3, // Higher to get slower videos, lower for faster videos [Value 1-100]
      outputDir: './reports/html-reports/',
    }],
    ['html', {
      outputDir: './reports/html-reports/',
      filename: 'report.html',
      reportTitle: 'Test Report Title',
      linkScreenshots: true,
    }],
  ],
```

# Configuration

Most users may want to set these configurations:

### `saveAllVideos`

Set to true to save videos for passing tests.

Type: `boolean`<br />
Default: `false`

### `rawPath`

Where to save the screenshots for the video.

Type: `string`<br />
Default: `.video-reporter-screenshots`

### `filenamePrefixSource`

Prefix for video filenames by either suite or test name. When using cucumber it will always be suite.

Type: `'suite' | 'test'`<br />
Default: `test`

### `videoSlowdownMultiplier`

Integer between [1-100]. Increase if videos are playing to quick.

Type: `number`<br />
Default: `3`

### `videoScale`

Scaling of video. See https://trac.ffmpeg.org/wiki/Scaling.

Type: `string`<br />
Default: `'1200:trunc(ow/a/2)*2'`

### `videoRenderTimeout`

Maximum time to wait for a video to finish rendering (in ms).

Type: `number`<br />
Default: `5000`

### `outputDir`

If it's not set, it uses [`outputDir`](https://webdriver.io/docs/configuration#outputdir).

Type: `string`<br />

### `maxTestNameCharacters`

Max length of test name.

Type: `number`<br />
Default: `250`

### `snapshotCommands`

Which commands should result in a screenshot: the last part of the WebDriver endpoint, for example `click` for
`/session/:sessionId/element/:elementId/click`.

Type: `string[]`<br />
Default: `['url', 'back', 'forward', 'refresh', 'sync', 'maximize', 'minimize', 'fullscreen', 'rect', 'click', 'value', 'clear', 'selected', 'enabled', 'displayed', 'accept', 'dismiss', 'actions', 'orientation']`

### `excludedActions`

Add actions where screenshots are unnecessary.

Type: `string[]`<br />
Default: `[]`

### `recordAllActions`

Skip filtering and screenshot everything. (Not recommended)

Type: `boolean`<br />
Default: `false`

### `screenshotIntervalSecs`

Force a screenshot at this interval (minimum 0.5s).

Type: `number`

### `videoFormat`

Video format (container) to be used. Supported formats: `mp4`, `webm`.

Type: `string`<br />
Default: `webm`

### `onlyRecordLastFailure`

Only record the last failure when `specFileRetries` is > 0

Type: `boolean`<br />
Default: `false`

## Cucumber Support

If you are using the Allure reporter with Cucumber, add `useCucumberStepReporter: true` to Allure option in `wdio.conf.js` file, a typical configuration would look like this:

```js
  reporters: [
    ['video', {
      saveAllVideos: false,       // If true, also saves videos for successful test cases
      videoSlowdownMultiplier: 3, // Higher to get slower videos, lower for faster videos [Value 1-100]
    }],
    ['allure', {
      outputDir: './_results_/allure-raw',
      disableWebdriverStepsReporting: true,
      disableWebdriverScreenshotsReporting: true,
      useCucumberStepReporter: true
    }],
  ],
```

For a complete example, check out the cucumber branch at the [wdio-template](https://github.com/presidenten/wdio-template/tree/cucumber)

## Appium Support

When the capabilities have no `browserName`, the reporter uses `appium:deviceName` and `platformName` in the video
file names, for example `PIXEL7-ANDROID`. With Allure, it also adds `deviceName` and `browserVersion` as arguments
of the test.

```js
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': 'Pixel 7',
    'appium:automationName': 'UiAutomator2',
    // ...
  }],
```

# Example

Check out the simple template at [wdio-template](https://github.com/presidenten/wdio-template) to quickly get up to speed.

# Older WebdriverIO Versions

This package supports WebdriverIO v10 and later. For WebdriverIO v9, use the community package
[`wdio-video-reporter`](https://github.com/webdriverio-community/wdio-video-reporter). Its configuration and options are the same.

Thanks
======

Thanks to [Johnson E](https://github.com/jonn-set) for fixing Cucumber support which a lot of users have asked for.
