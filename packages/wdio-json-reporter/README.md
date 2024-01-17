# WDIO JSON Reporter

> A WebdriverIO plugin. Report results in json format.

## Installation

```bash
npm install @wdio/json-reporter --save-dev
```

## Configuration

### Results to `stdout`

```js
reporters: [
    'dot',
    ['json', { stdout: true }]
],
```

### Results to File

```js
reporters: [
    'dot',
    ['json',{
        outputDir: './results'
    }]
],
```

### Results to File with custom file name

```js
reporters: [
    'dot',
    ['json',{
        outputDir: './results',
        outputFileFormat: (opts) => {
            return `results-${opts.cid}.${opts.capabilities.browserName}.json`
        }
    }]
],
```

## Result Files

With WDIO v5 upwards, reporting has moved from a centralized process to one that is handled by each of the "sessions" spun up for parallel test execution. This change helped reduce the amount of chatter during WDIO test execution and thus improved performance. The downside is it is no longer possible to get a single report for all test execution.

`@wdio/json-reporter` provides a utility function to merge the multiple json files into a single file. Follow the steps below to take advantage of the utility.

You can execute this in the [`onComplete`](https://webdriver.io/docs/configuration#oncomplete) of your `wdio.conf.js`:

```javascript
// wdio.conf.js
import mergeResults from '@wdio/json-reporter/mergeResults'

export const config = {
    // ...
    onComplete: function (exitCode, config, capabilities, results) {
        mergeResults('./results', 'wdio-.*-json-reporter.json', 'wdio-custom-filename.json')
    }
    // ...
}
```

_Note:_ `wdio-custom-filename.json` is optional, is the parameter is not provided the default value is `wdio-merged.json`.

## Contribution

The source code of this reporter was highly inspired by the [`wdio-json-reporter`](https://github.com/fijijavis/wdio-json-reporter) community reporter by [Jim Davis](https://github.com/fijijavis). Thanks for all the work maintaining the project!

---

For more information on WebdriverIO see the [homepage](http://webdriver.io).
