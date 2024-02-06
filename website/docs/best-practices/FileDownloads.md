---
id: file-download
title: File Download
---

# File Download

When automating file downloads in web testing, it's essential to handle them consistently across different browsers to ensure reliable test execution.

Here, we provide best practices for file downloads and demonstrate how to configure download directories for **Google Chrome**, **Mozilla Firefox**, and **Microsoft Edge**.

## Download Paths

**Hardcoding** download paths in test scripts can lead to maintenance issues and portability problems. Utilize **relative paths** for download directories to ensure portability and compatibility across different environments.

```javascript
// 👎
// Hardcoded download path
const downloadPath = '/path/to/downloads';

// 👍
// Relative download path
const downloadPath = path.join(__dirname, 'downloads');
```

## Wait Strategies

Failing to implement proper wait strategies can lead to race conditions or unreliable tests, especially for download completion. Implement **explicit** wait strategies to wait for file downloads to complete, ensuring synchronization between test steps.

```javascript
// 👎
// No explicit wait for download completion
await browser.pause(5000);

// 👍
// Wait for file download completion
await waitUntil(async ()=> await fs.existsSync(downloadPath), 5000);
```

## Configuring Download Directories With WebdriverIO

To override file download behavior for **Google Chrome**, **Mozilla Firefox**, and **Microsoft Edge**, provide the download directory in the WebDriverIO capabilities:

```javascript
// Google Chrome
capabilities: {
    browserName: 'chrome',
    'goog:chromeOptions': {
        prefs: {
            "download.default_directory": downloadPath
        }
    }
}

// Mozilla Firefox
capabilities: {
    browserName: 'firefox',
    'moz:firefoxOptions': {
        prefs: {
            'browser.download.dir': downloadPath,
            'browser.download.folderList': 2,
            'browser.download.manager.showWhenStarting': false,
            'browser.helperApps.neverAsk.saveToDisk': '*/*'
        }
    }
}

// Microsoft Edge
capabilities: {
    browserName: 'msedge',
    'ms:edgeOptions': {
        prefs: {
            "download.default_directory": downloadPath
        }
    }
}
```

For an example implementation, refer to the [WebdriverIO Test Download Behavior Recipe](https://github.com/webdriverio/example-recipes/tree/main/testDownloadBehavior).

## Configuring Chromium Browser Downloads with WebDriverIO

To change the download path for __Chromium-based__ browsers (such as Chrome, Edge, Brave, etc.) using WebDriverIO.

```javascript
const page = await browser.getPuppeteer();
// Initiate a CDP Session:
const cdpSession = await page.target().createCDPSession();
// Set the Download Path:
await cdpSession.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadPath });
```

## Handling Multiple File Downloads

When dealing with scenarios involving multiple file downloads, it's essential to implement strategies to manage and validate each download effectively. Consider the following approaches:

__Sequential Download Handling:__ Download files one by one and verify each download before initiating the next one to ensure orderly execution and accurate validation.

__Parallel Download Handling:__ Utilize asynchronous programming techniques to initiate multiple file downloads simultaneously, optimizing test execution time. Implement robust validation mechanisms to verify all downloads upon completion.

## Cross-Browser Compatibility Considerations

While WebDriverIO provides a unified interface for browser automation, it's essential to account for variations in browser behavior and capabilities. Consider testing your file download functionality across different browsers to ensure compatibility and consistency.

__Browser-Specific Configurations:__ Adjust download path settings and wait strategies to accommodate differences in browser behavior and preferences across Chrome, Firefox, Edge, and other supported browsers.

__Browser Version Compatibility:__ Regularly update your WebDriverIO and browser versions to leverage the latest features and enhancements while ensuring compatibility with your existing test suite.
