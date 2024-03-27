---
id: integrate-with-percy
title: For Web Application
---

## Integrate your WebdriverIO tests with Percy

Before integration, you can explore [Percy’s sample build tutorial for WebdriverIO](https://www.browserstack.com/docs/percy/sample-build/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation).
Integrate your WebdriverIO automated tests with BrowserStack Percy and here's an overview of the integration steps:

### Step 1: Create a Percy project
[Sign in](https://percy.io/signup/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) to Percy. In Percy, create a project of the type, Web, and then name the project. After the project is created, Percy generates a token. Make a note of it. You have to use it to set your environment variable in the next step.

For details on creating a project, see [Create a Percy project](https://www.browserstack.com/docs/percy/get-started/create-project/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation).

### Step 2: Set the project token as an environment variable

Run the given command to set PERCY_TOKEN as an environment variable:

```sh
export PERCY_TOKEN="<your token here>"   // macOS or Linux
$Env:PERCY_TOKEN="<your token here>"   // Windows PowerShell
set PERCY_TOKEN="<your token here>"    // Windows CMD
```

### Step 3: Install Percy dependencies

Install the components required to establish the integration environment for your test suite.

To install the dependencies, run the following command:

```sh
npm install --save-dev @percy/cli @percy/webdriverio
```

### Step 4: Update your test script

Import the Percy library to use the method and attributes required to take screenshots.
The following example uses the percySnapshot() function in the async mode:

```sh
import percySnapshot from '@percy/webdriverio';
describe('webdriver.io page', () => {
  it('should have the right title', async () => {
    await browser.url('https://webdriver.io');
    await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js');
    await percySnapshot('webdriver.io page');
  });
});
```

When using WebdriverIO in the [standalone mode](https://webdriver.io/docs/setuptypes.html/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation), provide the browser object as the first argument to the `percySnapshot` function:

```sh
import { remote } from 'webdriverio'

import percySnapshot from '@percy/webdriverio';

const browser = await remote({
  logLevel: 'trace',
  capabilities: {
    browserName: 'chrome'
  }
});

await browser.url('https://duckduckgo.com');
const inputElem = await browser.$('#search_form_input_homepage');
await inputElem.setValue('WebdriverIO');
const submitBtn = await browser.$('#search_button_homepage');
await submitBtn.click();
// the browser object is required in standalone mode
percySnapshot(browser, 'WebdriverIO at DuckDuckGo');
await browser.deleteSession();
```
The snapshot method arguments are:

```sh
percySnapshot(name[, options])
```
### Standalone mode

```sh
percySnapshot(browser, name[, options])
```

- browser (required) - The WebdriverIO browser object
- name (required) - The snapshot name; must be unique to each snapshot
- options - See per-snapshot configuration options

To learn more, see [Percy snapshot](https://www.browserstack.com/docs/percy/take-percy-snapshots/overview/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation).

### Step 5: Run Percy
Run your tests using the `percy exec` command as shown below:

If you are unable to use the `percy:exec` command or prefer to run your tests using IDE run options, you can use the `percy:exec:start` and `percy:exec:stop` commands. To learn more, visit [Run Percy](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation).

```sh
percy exec -- wdio wdio.conf.js
```

```sh
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Running "wdio wdio.conf.js"
...
[...] webdriver.io page
[percy] Snapshot taken "webdriver.io page"
[...]    ✓ should have the right title
...
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!

```

## Visit the following pages for more details:
- [Integrate your WebdriverIO tests with Percy](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- [Environment variable page](https://www.browserstack.com/docs/percy/get-started/set-env-var/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)
- [Integrate using BrowserStack SDK](https://www.browserstack.com/docs/percy/integrate-bstack-sdk/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) if you are using BrowserStack Automate.


| Resource                                                                                                                                                            | Description                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|
| [Official docs](https://www.browserstack.com/docs/percy/integrate/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)             | Percy's WebdriverIO documentation |
| [Sample build - Tutorial](https://www.browserstack.com/docs/percy/sample-build/webdriverio/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) | Percy's WebdriverIO tutorial      |
| [Official video](https://youtu.be/1Sr_h9_3MI0/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                                              | Visual Testing with Percy         |
| [Blog](https://www.browserstack.com/blog/introducing-visual-reviews-2-0/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation)                    | Introducing Visual Reviews 2.0    |
