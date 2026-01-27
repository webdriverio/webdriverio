---
id: testmuai
title: TestMu AI (Formerly LambdaTest) Accessibility Testing
---

# TestMu AI Accessibility Testing

You can easily integrate accessibility tests in your WebdriverIO test suites using [TestMu AI Accessibility Testing](https://www.testmuai.com/support/docs/accessibility-automation-settings/).

## Advantages of TestMu AI Accessibility Testing

TestMu AI Accessibility Testing helps you identify and fix accessibility issues in your web applications. The following are the key advantages:

* Seamlessly integrates with your existing WebdriverIO test automation.
* Automated accessibility scanning during test execution.
* Comprehensive WCAG compliance reporting.
* Detailed issue tracking with remediation guidance.
* Support for multiple WCAG standards (WCAG 2.0, WCAG 2.1, WCAG 2.2).
* Real-time accessibility insights in the TestMu AI dashboard.

## Get Started with TestMu AI Accessibility Testing

Follow these steps to integrate your WebdriverIO test suites with TestMu AI's Accessibility Testing:

1. Install the TestMu AI WebdriverIO service package.

```bash npm2yarn
npm install --save-dev @lambdatest/wdio-lambdatest-service
```

2. Update your `wdio.conf.js` configuration file.

```javascript
exports.config = {
    //...
    user: process.env.LT_USERNAME || '<lambdatest_username>',
    key: process.env.LT_ACCESS_KEY || '<lambdatest_access_key>',

    capabilities: [{
        browserName: 'chrome',
        'LT:Options': {
            platform: 'Windows 10',
            version: 'latest',
            accessibility: true, // Enable accessibility testing
            accessibilityOptions: {
                wcagVersion: 'wcag21a', // WCAG version (wcag20, wcag21a, wcag21aa, wcag22aa)
                bestPractice: false,
                needsReview: true
            }
        }
    }],

    services: [
        ['lambdatest', {
            tunnel: false
        }]
    ],
    //...
};
```

3. Run your tests as usual. TestMu AI will automatically scan for accessibility issues during test execution.

```bash
npx wdio run wdio.conf.js
```

## Configuration Options

The `accessibilityOptions` object supports the following parameters:

* **wcagVersion**: Specify the WCAG standard version to test against
  - `wcag20` - WCAG 2.0 Level A
  - `wcag21a` - WCAG 2.1 Level A
  - `wcag21aa` - WCAG 2.1 Level AA (default)
  - `wcag22aa` - WCAG 2.2 Level AA

* **bestPractice**: Include best practice recommendations (default: `false`)

* **needsReview**: Include issues that need manual review (default: `true`)

## Viewing Accessibility Reports

After your tests complete, you can view detailed accessibility reports in the [TestMu AI Dashboard](https://automation.lambdatest.com/):

1. Navigate to your test execution
2. Click on the "Accessibility" tab
3. Review identified issues with severity levels
4. Get remediation guidance for each issue

For more detailed information, visit the [TestMu AI Accessibility Automation documentation](https://www.testmuai.com/support/docs/accessibility-automation-settings/).
