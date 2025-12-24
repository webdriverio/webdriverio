---
id: integrate-with-smartui
title: SmartUI
---

LambdaTest [SmartUI](https://www.lambdatest.com/smart-visual-testing) provides AI-powered visual regression testing for your WebdriverIO tests. It captures screenshots, compares them against baselines, and highlights visual differences with intelligent comparison algorithms.

## Setup

**Create a SmartUI project**

[Sign in](https://accounts.lambdatest.com/register) to LambdaTest and navigate to [SmartUI Projects](https://smartui.lambdatest.com/) to create a new project. Select **Web** as the platform and configure your project name, approvers, and tags.

**Set up credentials**

Get your `LT_USERNAME` and `LT_ACCESS_KEY` from the LambdaTest dashboard and set them as environment variables:

```sh
export LT_USERNAME="<your username>"
export LT_ACCESS_KEY="<your access key>"
```

**Install SmartUI SDK**

```sh
npm install @lambdatest/wdio-driver
```

**Configure WebdriverIO**

Update your `wdio.conf.js`:

```javascript
exports.config = {
  user: process.env.LT_USERNAME,
  key: process.env.LT_ACCESS_KEY,
  
  capabilities: [{
    browserName: 'chrome',
    browserVersion: 'latest',
    'LT:Options': {
      platform: 'Windows 10',
      build: 'SmartUI Build',
      name: 'SmartUI Test',
      smartUI.project: '<Your Project Name>',
      smartUI.build: '<Your Build Name>',
      smartUI.baseline: false
    }
  }]
}
```

## Usage

Use `browser.execute('smartui.takeScreenshot')` to capture screenshots:

```javascript
describe('WebdriverIO SmartUI Test', () => {
  it('should capture screenshot for visual testing', async () => {
    await browser.url('https://webdriver.io');
    
    await browser.execute('smartui.takeScreenshot', {
      screenshotName: 'Homepage Screenshot'
    });
    
    await browser.execute('smartui.takeScreenshot', {
      screenshotName: 'Homepage with Options',
      ignoreDOM: {
        id: ['dynamic-element-id'],
        class: ['ad-banner']
      }
    });
  });
});
```

**Run tests**

```sh
npx wdio wdio.conf.js
```

View results in the [SmartUI Dashboard](https://smartui.lambdatest.com/).

## Advanced Options

**Ignore elements**

```javascript
await browser.execute('smartui.takeScreenshot', {
  screenshotName: 'Ignore Dynamic Elements',
  ignoreDOM: {
    id: ['element-id'],
    class: ['dynamic-class'],
    xpath: ['//div[@class="ad"]']
  }
});
```

**Select specific areas**

```javascript
await browser.execute('smartui.takeScreenshot', {
  screenshotName: 'Compare Specific Area',
  selectDOM: {
    id: ['main-content']
  }
});
```

## Resources

| Resource                                                                                          | Description                              |
|---------------------------------------------------------------------------------------------------|------------------------------------------|
| [Official Documentation](https://www.lambdatest.com/support/docs/smart-ui-cypress/)              | SmartUI Documentation                    |
| [SmartUI Dashboard](https://smartui.lambdatest.com/)                                              | Access your SmartUI projects and builds  |
| [Advanced Settings](https://www.lambdatest.com/support/docs/test-settings-options/)              | Configure comparison sensitivity         |
| [Build Options](https://www.lambdatest.com/support/docs/smart-ui-build-options/)                 | Advanced build configuration             |
