---
id: integrate-with-app-percy
title: For Mobile Application
---

## Integrate your WebdriverIO tests with App Percy

Before integration, you can explore [App Percy’s sample build tutorial for WebdriverIO](https://www.browserstack.com/docs/app-percy/sample-build/webdriverio-javascript/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation).
Integrate your test suite with BrowserStack App Percy and here's an overview of the integration steps:

### Step 1: Create new app project on percy dashboard

[Sign in](https://percy.io/signup/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) to Percy and [create a new app type project](https://www.browserstack.com/docs/app-percy/get-started/create-project/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation). After you’ve created the project, you’ll be shown a `PERCY_TOKEN` environment variable. Percy will use the `PERCY_TOKEN` to know which organisation and project to upload the screenshots to. You will need this `PERCY_TOKEN` in next steps.

### Step 2: Set the project token as an environment variable

Run the given command to set PERCY_TOKEN as an environment variable:

```sh
export PERCY_TOKEN="<your token here>"   // macOS or Linux
$Env:PERCY_TOKEN="<your token here>"    // Windows PowerShell
set PERCY_TOKEN="<your token here>"    // Windows CMD
```

### Step 3: Install Percy packages

Install the components required to establish the integration environment for your test suite.
To install the dependencies, run the following command:

```sh
npm install --save-dev @percy/cli
```

### Step 4: Install dependencies

Install the Percy Appium app

```sh
npm install --save-dev @percy/appium-app
```

### Step 5: Update test script
Make sure to import @percy/appium-app in your code.

Below is an example test using the percyScreenshot function. Use this function wherever you have to take a screenshot.

```sh
import percyScreenshot from '@percy/appium-app';
describe('Appium webdriverio test example', function() {
  it('takes a screenshot', async () => {
    await percyScreenshot('Appium JS example');
  });
});
```
We are passing the required arguments.percyScreenshot method.

The screenshot method arguments are:

```sh
percyScreenshot(driver, name[, options])
```
### Step 6: Run your test script

Run your tests using `percy app:exec`.

If you are unable to use the percy app:exec command or prefer to run your tests using IDE run options, you can use the percy app:exec:start and percy app:exec:stop commands. To learn more, visit [Run Percy](https://www.browserstack.com/docs/app-percy/references/commands/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation).

```sh
$ percy app:exec -- appium test command
```
This command starts Percy, create a new Percy build, takes snapshots and uploads them to your project, and stops Percy:


```sh
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Snapshot taken "Appium WebdriverIO Example"
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Visit the following pages for more details:
- [Integrate your WebdriverIO tests with Percy](https://www.browserstack.com/docs/app-percy/integrate/webdriverio-javascript/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- [Environment variable page](https://www.browserstack.com/docs/app-percy/get-started/set-env-var/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- [Integrate using BrowserStack SDK](https://www.browserstack.com/docs/app-percy/integrate-bstack-sdk/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) if you are using BrowserStack Automate.


| Resource                                                                                                                                                            | Description                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|
| [Official docs](https://www.browserstack.com/docs/app-percy/integrate/webdriverio-javascript/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)             | App Percy's WebdriverIO documentation |
| [Sample build - Tutorial](https://www.browserstack.com/docs/app-percy/sample-build/webdriverio-javascript/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) | App Percy's WebdriverIO tutorial      |
| [Official video](https://youtu.be/a4I_RGFdwvc/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                                              | Visual Testing with App Percy         |
| [Blog](https://www.browserstack.com/blog/product-launch-app-percy/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                    | Meet App Percy: AI-powered automated visual testing platform for native apps    |
