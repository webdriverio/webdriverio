WebdriverIO Sumologic Reporter
==============================

> A WebdriverIO reporter that sends test results to [Sumologic](https://www.sumologic.com/) for data analyses

![Sumologic Dashboard](/img/sumologic.png "Sumologic Dashboard")

## Installation

The easiest way is to keep `@wdio/sumologic-reporter` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/sumologic-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted).

## Configuration

First we have to create a new collector that collects all logs of your tests. To do that click on __Manage__ in the navigation bar and go to __Collection__. There you need to add a new "Hosted Collector". Apply a suited name, e.g. "test integration logs", description and a category, e.g. "wdio". Click on Save to create the collector.

![Add Collector](https://webdriver.io/images/sumo-collector.png "Add Collector")

Next step is to add a source. It makes sense to have an own source for each of your environment (e.g. branch build, integration). Click on the "Add Source" link next to your collector and add an __HTTP Source__. Apply again a suiteable name and description and set a "Source Category" that reflects the environment. Leave the other options in default state and click on save.

![Add Source](https://webdriver.io/images/sumo-source.png "Add Source")

A modal pops up with the source endpoint. Copy that url and paste it into your wdio.conf.js so the reporter know where to send the data.

Following code shows the default wdio test runner configuration. Just add `'sumologic'` as reporter to the array and add your source endpoint:

```js
// wdio.conf.js
module.exports = {
  // ...
  reporters: [
    'spec',
    ['sumologic', {
        // define sync interval how often logs get pushed to Sumologic
        syncInterval: 100,
        maxRetries: 5,
        requestTimeout: 30000,
        shutdownTimeout: 4000,
        // endpoint of collector source
        sourceAddress: process.env.SUMO_SOURCE_ADDRESS
    }]
  ],
  // ...
};
```

### Delivery behaviour

Each collector request is limited to a positive `requestTimeout` in milliseconds (default: `30000`); non-positive or invalid values use the default. Transient failures — network errors, `408`, `429`, and `5xx` responses — are retried with backoff. `maxRetries` counts retries after the initial delivery attempt and defaults to `5`. A successful batch resets the retry counter.

Other unsuccessful HTTP responses disable the reporter immediately. When its retry limit is reached, the reporter stops its timer and discards its remaining queued logs. Delivery is best effort: logs may be lost, and retries can produce duplicates if the collector accepts a request before it times out.

After `runner:end`, `shutdownTimeout` limits the total time for remaining delivery attempts (default: `4000` milliseconds). Successful batches do not reset this deadline. When it expires, the reporter aborts the active request, stops its timers, discards pending logs, and logs their count. Non-positive or invalid values use the default; positive finite values are rounded up and capped at `2147483647`. Keep `shutdownTimeout` below WebdriverIO's `reporterSyncTimeout` (default: `5000`), with enough margin for `reporterSyncInterval` polling. A longer shutdown budget may require increasing both options. The shutdown deadline may expire before all configured retries are used.

After running the first tests with the reporter you should be able to check out the tests logs with the following query:

```
_source=wdio
| parse "\"type\":\"*:*\"" as type,status
| json auto
```

I will provide some useful dashboard templates for Sumologic soon.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
