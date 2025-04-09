---
id: seleniumgrid
title: Selenium Grid
---

You can use WebdriverIO with your existing Selenium Grid instance. To connect your tests to Selenium Grid, you just need to update the options in your test runner configurations.

Here is a code snippet from sample wdio.conf.ts.

```ts title=wdio.conf.ts
export const config: Options.Testrunner = {
    // ...
    protocol: 'https',
    hostname: 'yourseleniumgridhost.yourdomain.com',
    port: 443,
    path: '/wd/hub',
    // ...

}
```

You need to provide the appropriate values for the protocol, hostname, port, and path based on your Selenium Grid setup.
If you are running Selenium Grid on the same machine as your test scripts, here are some typical options:

```ts title=wdio.conf.ts
export const config: Options.Testrunner = {
    // ...
    protocol: 'http',
    hostname: 'localhost',
    port: 4444,
    path: '/wd/hub',
    // ...

}
```

### Basic authentication with protected Selenium Grid

It is highly recommended to secure your Selenium Grid. If you have a protected Selenium Grid that requires authentication, you can pass authentication headers via options.
Please refer to the [headers](https://webdriver.io/docs/configuration/#headers) section in the documentation for more information.

### Timeout configurations with dynamic Selenium Grid

When using a dynamic Selenium Grid where browser pods are spun up on demand, session creation may face a cold start. In such cases, it is advised to increase the session creation timeouts. The default value in the options is 120 seconds, but you can increase it if your grid takes more time to create a new session.

```ts
connectionRetryTimeout: 180000,
```

### Advanced configurations

For advanced configurations, please refer to the Testrunner [configuration file](https://webdriver.io/docs/configurationfile).

### File operations with Selenium Grid

When running test cases with a remote Selenium Grid, the browser runs on a remote machine, and you need to take special care with test cases involving file uploads and downloads.

### File downloads

For Chromium-based browsers, you can refer to the [Download file](https://webdriver.io/docs/api/browser/downloadFile) documentation. If your test scripts need to read the content of a downloaded file, you need to download it from the remote Selenium node to the test runner machine. Here is an example code snippet from the sample `wdio.conf.ts` configuration for the Chrome browser:

```ts title=wdio.conf.ts
export const config: WebdriverIO.Config = {
    // ...
    protocol: 'https',
    hostname: 'yourseleniumgridhost.yourdomain.com',
    port: 443,
    path: '/wd/hub',
    // ...
    capabilities: [{
        browserName: 'chrome',
        'se:downloadsEnabled': true
    }],
    //...
}
```

### File upload with remote Selenium Grid

To upload a file to a web app in the remote browser, you first need to upload the file to the remote grid. You can refer to the [uploadFile](https://webdriver.io/docs/api/browser/uploadFile) documentation for details.

### Other file/grid operations

There are a few more operations that you can perform with Selenium Grid. The instructions for Selenium Standalone should work fine with Selenium Grid as well. Please refer to the [Selenium Standalone](https://webdriver.io/docs/api/selenium/) documentation for available options.

### Selenium Grid Official documentation

For more information on Selenium Grid, you can refer to the official Selenium Grid [documentation](https://www.selenium.dev/documentation/grid/).

If you wish to run Selenium Grid in Docker, Docker compose or Kubernetes, please refer to the Selenium-Docker [GitHub repository](https://github.com/SeleniumHQ/docker-selenium).