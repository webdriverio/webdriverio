---
id: تنزيل-الملف
title: تنزيل الملف
---

عند أتمتة تنزيل الملف في اختبار الويب من الأساسي تنفيذها بشكل مستمر عبر متصفحات مختلفة للتأكد من موثوقية تنفيذ الاختبار.

هنا، نحن نوفر أفضل الممارسات لتنزيل الملفات ونوضح كيفية تكوين أدلة التحميل لـ **Google Chrome**، **Mozilla Firefox**، و **Microsoft Edge**.

## مسارات التنزيل

**الترميز الثابت** مسارات التنزيل في نص الاختبار يمكن أن يؤدي إلى مشاكل في الصيانة وإمكانية النقل. استخدام **المسارات النسبية** لمسارات التنزيل لضمان قابلية النقل والتوافق عبر البيئات المختلفة.

```javascript
// 👎
// Hardcoded download path
const downloadPath = '/path/to/downloads';

// 👍
// Relative download path
const downloadPath = path.join(__dirname, 'downloads');
```

## إستراتيجيات الإنتظار

Failing to implement proper wait strategies can lead to race conditions or unreliable tests, especially for download completion. Implement **explicit** wait strategies to wait for file downloads to complete, ensuring synchronization between test steps.

```javascript
// 👎
// No explicit wait for download completion
await browser.pause(5000);

// 👍
// Wait for file download completion
await waitUntil(async ()=> await fs.existsSync(downloadPath), 5000);
```

## Configuring Download Directories

To override file download behavior for **Google Chrome**, **Mozilla Firefox**, and **Microsoft Edge**, provide the download directory in the WebDriverIO capabilities:

<Tabs
defaultValue="chrome"
values={[
{label: 'Chrome', value: 'chrome'},
{label: 'Firefox', value: 'firefox'},
{label: 'Microsoft Edge', value: 'edge'},
]
}>

<TabItem value='chrome'>

```javascript reference title="wdio.conf.js"

https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L8-L16

```

</TabItem>

<TabItem value='firefox'>

```javascript reference title="wdio.conf.js"

https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L20-L32

```

</TabItem>

<TabItem value='edge'>

```javascript reference title="wdio.conf.js"

https://github.com/webdriverio/example-recipes/blob/84dda93011234d0b2a34ee0cfb3cdfa2a06136a5/testDownloadBehavior/wdio.conf.js#L36-L44

```

</TabItem>

</Tabs>

For an example implementation, refer to the [WebdriverIO Test Download Behavior Recipe](https://github.com/webdriverio/example-recipes/tree/main/testDownloadBehavior).

## Configuring Chromium Browser Downloads

To change the download path for **Chromium-based** browsers (such as Chrome, Edge, Brave, etc.) using WebDriverIOs `getPuppeteer` method for accessing Chrome DevTools.

```javascript
const page = await browser.getPuppeteer();
// Initiate a CDP Session:
const cdpSession = await page.target().createCDPSession();
// Set the Download Path:
await cdpSession.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });
```

## Handling Multiple File Downloads

When dealing with scenarios involving multiple file downloads, it's essential to implement strategies to manage and validate each download effectively. Consider the following approaches:

**Sequential Download Handling:** Download files one by one and verify each download before initiating the next one to ensure orderly execution and accurate validation.

**Parallel Download Handling:** Utilize asynchronous programming techniques to initiate multiple file downloads simultaneously, optimizing test execution time. Implement robust validation mechanisms to verify all downloads upon completion.

## Cross-Browser Compatibility Considerations

While WebDriverIO provides a unified interface for browser automation, it's essential to account for variations in browser behavior and capabilities. Consider testing your file download functionality across different browsers to ensure compatibility and consistency.

**Browser-Specific Configurations:** Adjust download path settings and wait strategies to accommodate differences in browser behavior and preferences across Chrome, Firefox, Edge, and other supported browsers.

**Browser Version Compatibility:** Regularly update your WebDriverIO and browser versions to leverage the latest features and enhancements while ensuring compatibility with your existing test suite.
