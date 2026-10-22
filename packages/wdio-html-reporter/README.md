WebdriverIO HTML Reporter
=========================

> A WebdriverIO reporter that creates an HTML report

Each worker writes a JSON file of its results. The `ReportAggregator` then creates one HTML report for all workers, with logs, screenshots and videos for each test.

This package was [`wdio-html-nice-reporter`](https://github.com/rpii/wdio-html-reporter) by Rich Peters.

## Installation

The easiest way is to keep `@wdio/html-reporter` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/html-reporter --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted).

## Configuration

Add the reporter to the `reporters` array, and create the full report in the `onPrepare` and `onComplete` hooks:

```ts
// wdio.conf.ts
import { ReportAggregator } from '@wdio/html-reporter'

let reportAggregator: ReportAggregator

export const config: WebdriverIO.Config = {
    // ...
    reporters: ['spec',
        ['html', {
            outputDir: './reports/html-reports/',
            filename: 'report.html',
            reportTitle: 'Test Report Title',
            // add the result of each screenshot command to the report
            useOnAfterCommandForScreenshot: false
        }]
    ],

    onPrepare: function (config, capabilities) {
        reportAggregator = new ReportAggregator({
            outputDir: './reports/html-reports/',
            filename: 'master-report.html',
            reportTitle: 'Master Report',
            browserName: 'chrome',
            linkScreenshots: true,
            collapseTests: true,
            // show the report in a browser when it is done
            showInBrowser: true
        })
        reportAggregator.clean()
    },

    onComplete: async function () {
        await reportAggregator.createReport()
    }
}
```

`outputDir` can be relative to the folder where you start WebdriverIO, or absolute.

In a CommonJS configuration (`wdio.conf.cjs`), load the package with `const { ReportAggregator } = require('@wdio/html-reporter')`.

When a worker stops before it writes its results (for example it is killed), or cannot write them, the master report says so and `reportAggregator.failed` is `true`. It is also `true` when no worker wrote a JSON file.

The master report uses the options of the `ReportAggregator`: set `linkScreenshots`, `linkUrls`, `collapseTests`, `collapseSuites` and `showInBrowser` there. The options of the reporter are for the JSON files and the report of each worker (`produceHtml`).

## Options

| Option | Default | Description |
|---|---|---|
| `outputDir` | `reports/html-reports/` | Folder of the JSON files and the report: relative to the current working folder, or absolute. |
| `filename` | `report.html` | File name of the report. |
| `reportTitle` | `Test Report Title` | Title of the report. |
| `showInBrowser` | `false` | Open the report in a browser when it is done (`ReportAggregator` only). |
| `collapseTests` | `false` | Collapse the tests in the report. |
| `collapseSuites` | `false` | Collapse the suites in the report. |
| `useOnAfterCommandForScreenshot` | `false` | Add the result of each screenshot command to the current test. With `@wdio/video-reporter` in a WebDriver Classic session, the video frames also become screenshots: keep it `false`. |
| `linkScreenshots` | `false` | Link the screenshots in the report. If `false`, the report includes them as base64 data. |
| `linkUrls` | `false` | Make the `http` and `https` URLs in log messages links. The rest of the message stays escaped: HTML in a log message shows as text. |
| `browserName` | `not specified` | Browser name to show in the report. The browser is not known when the configuration loads, so set it yourself. |
| `removeOutput` | `true` | Remove the console output of the tests from the JSON files. |
| `produceJson` | `true` | Write the JSON file of each worker. The `ReportAggregator` needs these files. |
| `produceHtml` | `false` | Also write an HTML report for each worker, next to its JSON file. |

## Logs, screenshots and videos

Send messages, screenshots and videos from your tests to the current test of the report with `ReportEvents`:

```ts
import { ReportEvents } from '@wdio/html-reporter'

const reportEvents = new ReportEvents()

it('logs in', async () => {
    reportEvents.logMessage('Show the login screen')
    const file = './reports/html-reports/screenshots/login.png'
    await browser.saveScreenshot(file)
    reportEvents.logScreenshot(file)
})
```

`ReportEvents` sends the same events as [`@rpii/wdio-report-events`](https://www.npmjs.com/package/@rpii/wdio-report-events), so tests that use that package still work.

[`@wdio/video-reporter`](https://webdriver.io/docs/video-reporter) sends the video of each test to this reporter. Set the same `outputDir` for both reporters.

## Create the report from the command line

If the report is not created in `onComplete` (for example with some Cucumber or Jasmine setups), create it after the test run:

```sh
node node_modules/@wdio/html-reporter/build/makeReport.js master-report.html reports/html-reports/ "Master Report"
```

The arguments are the file name of the report, the folder of the JSON files (default `reports/html-reports/`) and
the title (default `Master Report`). The script opens the report in a browser, except when the `CI` environment
variable is set. It ends with exit code 1 when the folder does not exist, has no JSON file of a worker, or when it
cannot make the report, so a CI step fails.

## PDF report

To create a PDF file from the report, see [`@rpii/wdio-html-reporter-pdf`](https://www.npmjs.com/package/@rpii/wdio-html-reporter-pdf).

## Older WebdriverIO Versions

This package supports WebdriverIO v10 and later. For WebdriverIO v9, use [`wdio-html-nice-reporter`](https://www.npmjs.com/package/wdio-html-nice-reporter). For v9, its reporter name is `html-nice`. For v10, the name is `html`.
To move from that package to this one, see the [v10 migration guide](https://webdriver.io/docs/v10-migration#html-reporter).
