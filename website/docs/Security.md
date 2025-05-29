---
id: security
title: Security
---

WebdriverIO has the security aspect in mind when providing solutions. Below are some ways to better secure your test.

# Masking Sensitive Data

If you are using sensitive data during your test, it is essential to ensure that they are not visible to everyone, such as in logs. Also, when using a cloud provider, private keys are often involved. This information must be masked from logs, reporters, and other touchpoints. The following provides some masking solutions to run tests without exposing those values.

## WebDriverIO

### Mask Commands' Text Value

The commands `addValue` and `setValue` support a boolean mask value to mask in WDIO and Appium logs, as well as reporters. Moreover, other tools, such as performance tools and third-party tools, will also receive the mask version, enhancing security.

For example, if you are using a real production user and need to enter a password that you want to mask, then it is now possible with the following:

```ts
  async enterPassword(userPassword) {
    const passwordInputElement = $('Password');

    // Get focus
    await passwordInputElement.click();

    await passwordInputElement.setValue(userPassword, { mask: true });
  }
```

The above will hide the text value from WDIO logs and also from Appium logs. 

Logs example:
```text
2025-05-25T23:02:42. 336Z INFO webdriver: DATA { text: "**MASKED**" }
```

Limitations:
  - In Appium, additional plugins could leak even though we ask to mask the information.
  - Cloud providers could use a proxy for HTTP logging, which bypasses the mask mechanism put in place.

:::info

Minimum required version:
 - WDIO v9.15.0
 - Appium v2.19.0

### Mask in WDIO Logs

Using the `maskingPatterns` configuration, we can mask sensitive information from WDIO logs. However, Appium logs are not covered.

For example, if you are using a Cloud provider and use the info level, then most certainly you will "leak" the user's key as shown below:

```text
2025-05-29T19:09:11.309Z INFO @wdio/local-runner: Start worker 0-0 with arg: ./wdio.conf.ts --user=cloud_user --key=myCloudSecretExposedKey --spec myTest.test.ts
```

To counter that we can pass the the regular expression `'--key=([^ ]*)'` and now in the logs you will see 

```text
2025-05-29T19:09:11.309Z INFO @wdio/local-runner: Start worker 0-0 with arg: ./wdio.conf.ts --user=cloud_user --key=**MASKED** --spec myTest.test.ts
```

You can achieve the above by providing the regular expression to the `maskingPatterns` field of the configuration.
  - For multiple regular expressions, use a single string but with a comma-separated value.
  - For more details on masking patterns, see the [Masking Patterns section in the WDIO Logger README](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-logger/README.md#masking-patterns).

```ts
export const config: WebdriverIO.Config = {
    specs: [...],
    capabilities: [{...}],
    services: ['lighthouse'],

    /**
     * test configurations
     */
    logLevel: 'info',
    maskingPatterns: '/--key=([^ ]*)/',
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
```

:::info

Minimum required version:
 - WDIO v9.15.0

### Disable WDIO Loggers

Another way to block the logging of sensitive data is to lower or silence the log level or disable the logger.
It can achieved as follow:

```ts
/**
  * Set the logger level of the WDIO logger to 'silent' before *running a promise, which helps hide sensitive information in the logs.
 */
export const withSilentLogger = async <T>(promise: () => Promise<T>): Promise<T> => {
  const webdriverLogLevel = driver.options.logLevel ?? 'error';

  try {
    logger.setLevel('webdriver', 'silent');
    return await promise();
  } finally {
    logger.setLevel('webdriver', webdriverLogLevel);
  }
};
```

## Thirds Party Solutions

### Appium
Appium offers its masking solution; see [Log filter](https://appium.io/docs/en/2.0/guides/log-filters/)
 - It can be tricky to use their solution. One way if possible is to pass a token in your string like `@mask@` and use it as a regular expression
 - In some Appium versions, the values are also logged with each character comma-separated, so we need to be careful.
 - Unfortunately, BrowserStack does not support this solution, but it is still useful locally
 
Using the `@mask@` example previously mentioned, we can use the following JSON file named `appiumMaskLogFilters.json`
```json
[
  {
    "pattern": "@mask@(.*)",
    "flags": "s",
    "replacer": "**MASKED**"
  },
  {
    "pattern": "\\[(\\\"@\\\",\\\"m\\\",\\\"a\\\",\\\"s\\\",\\\"k\\\",\\\"@\\\",\\S+)\\]",
    "flags": "s",
    "replacer": "[*,*,M,A,S,K,E,D,*,*]"
  }
]
```

Then pass the JSON file name to the `logFilters` field into the appium service config:
```ts
import { AppiumServerArguments, AppiumServiceConfig } from '@wdio/appium-service';
import { ServiceEntry } from '@wdio/types/build/Services';

const appium = [
  'appium',
  {
    args: {
      log: './logs/appium.log',
      logFilters: './appiumMaskLogFilters.json',
    } satisfies AppiumServerArguments,
  } satisfies AppiumServiceConfig,
] satisfies ServiceEntry;
```

### BrowserStack

BrowserStack also offer some level of masking to hide some data; see [hide sensitive data](https://www.browserstack.com/docs/automate/selenium/hide-sensitive-data)
 - Unfortunately, the solution is all-or-nothing, so all text values of provided commands will be masked.
