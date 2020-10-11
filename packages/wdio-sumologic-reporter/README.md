WebdriverIO Sumologic Reporter
==============================

> A WebdriverIO reporter that sends test results to [Sumologic](https://www.sumologic.com/) for data analyses

![Sumologic Dashboard](https://webdriver.io/images/sumologic.png "Sumologic Dashboard")

## Installation

The easiest way is to keep `@wdio/sumologic-reporter` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/sumologic-reporter": "^6.3.6"
  }
}
```

You can simple do it by:

```sh
$ npm install @wdio/sumologic-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted.html).

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
        // endpoint of collector source
        sourceAddress: process.env.SUMO_SOURCE_ADDRESS
    }]
  ],
  // ...
};
```

After running the first tests with the reporter you should be able to check out the tests logs with the following query:

```
_source=wdio
| parse "\"type\":\"*:*\"" as type,status
| json auto
```

I will provide some useful dashboard templates for Sumologic soon.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
