name: teamcity
category: reporters
tags: guide
index: 2
title: WebdriverIO - Teamcity Reporter
---

WDIO Teamcity Reporter
======================

WebdriverIO Teamcity reporter which makes it possible to display test results in real-time, makes test information available on the Tests tab of the Build Results page.

## Installation

```bash
npm install wdio-teamcity-reporter --save-dev
```

Instructions on how to install WebdriverIO can be found [here](http://webdriver.io/guide/getstarted/install.html).

## Configuration

Add the reporter to your reporter list in your [wdio.conf.js](http://webdriver.io/guide/testrunner/configurationfile.html) file:

```js
exports.config = {
  // ...
  reporters: ['teamcity'],
  // ...
}
```

## Links

- Reference to the Teamcity documentation about reporting messages: [https://confluence.jetbrains.com/display/TCD65/Build+Script+Interaction+with+TeamCity](https://confluence.jetbrains.com/display/TCD65/Build+Script+Interaction+with+TeamCity)
