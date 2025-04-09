---
id: browserstack
title: BrowserStack Accessibility Testing
---

# BrowserStack Accessibility Testing

You can easily integrate accessibility tests in your WebdriverIO test suites using the Automated tests feature of BrowserStack Accessibility Testing.

## Advantages of Automated Tests in BrowserStack Accessibility Testing

To use Automated tests in BrowserStack Accessibility Testing, your tests should be running on BrowserStack Automate.

وفيما يلي مزايا الاختبارات المؤتمتة:

- Seamlessly integrates into your pre-existing automation test suite.
- لا حاجة للتعديل على الشيفرة البرمجية في حالات الاختبار.
- ويتطلب ذلك صفر من الصيانة الإضافية لاختبار قابلية الوصول.
- Understand historical trends and gain test-case insights.

## Get Started with BrowserStack Accessibility Testing

اتبع هذه الخطوات لدمج مجموعات اختبار WebdriverIO الخاصة بك مع اختبار قابلية وصول المتصفح:

1. Install `@wdio/browserstack-service` npm package.

```bash npm2yarn
```

2. تحديث ملف التكوين \`wdio.conf.js'.

```javascript
exports.config = {
    //...
    user: '<browserstack_username>' || process.env.BROWSERSTACK_USERNAME,
    key: '<browserstack_access_key>' || process.env.BROWSERSTACK_ACCESS_KEY,
    commonCapabilities: {
      'bstack:options': {
        projectName: "Your static project name goes here",
        buildName: "Your static build/job name goes here"
      }
    },
    services: [
      ['browserstack', {
        accessibility: true,
        // Optional configuration options
        accessibilityOptions: {
          'wcagVersion': 'wcag21a',
          'includeIssueType': {
            'bestPractice': false,
            'needsReview': true
          },
          'includeTagsInTestingScope': ['Specify tags of test cases to be included'],
          'excludeTagsInTestingScope': ['Specify tags of test cases to be excluded']
        },
      }]
    ],
    //...
  };
```

You can view detailed instructions here.

