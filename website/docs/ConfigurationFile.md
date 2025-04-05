---
id: configurationfile
title: Configuration File
---

The configuration file contains all necessary information to run your test suite.

Here is an example with some of the most common configuration options:

```js
import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    runner: 'local',
    specs: [
        'test/spec/**',
        ['group/spec/**']
    ],
    maxInstances: 10,
    capabilities: [
        {
            browserName: 'chrome',
        },
        {
        browserName: 'firefox',
        }
    ],
    logLevel: 'info',
    outputDir: './logs',
    baseUrl: 'http://localhost:8080',
    waitforTimeout: 30000,
    framework: 'mocha',
    reporters: [
        'dot',
        'allure'
    ],
    mochaOpts: {
        ui: 'bdd'
    },
})
```

You can also find a file with all possible options and variations in the [example folder](https://github.com/webdriverio/webdriverio/blob/main/examples/wdio.conf.js).
