---
id: vscode-extension-testing
title: VS Code Extension Testing
---

WebdriverIO allows you to seamlessly test your [VS Code](https://code.visualstudio.com/) extensions from end to end in the VS Code Desktop IDE or as web extension. You only need to provide a path to your extension and the framework does the rest. With the [`wdio-vscode-service`](https://www.npmjs.com/package/wdio-vscode-service) everything is taken care of and much more:

- 🏗️ Installing VSCode (either stable, insiders or a specified version)
- ⬇️ Downloading Chromedriver specific to given VSCode version
- 🚀 Enables you to access the VSCode API from your tests
- 🖥️ Starting VSCode with custom user settings (including support for VSCode on Ubuntu, MacOS and Windows)
- 🌐 Or serves VSCode from a server to be accessed by any browser for testing web extensions
- 📔 Bootstrapping page objects with locators matching your VSCode version

## Getting Started

To initiate a new WebdriverIO project, run:

```sh
npm create wdio@latest ./
```

An installation wizard will guide you through the process. Ensure you select TypeScript as compiler and don't have it generate page objects for you given this project comes with all page objects needed. Then make sure to select `vscode` within the list of services, e.g.:

![WebdriverIO Configuration Wizard](/img/vscode.gif "WebdriverIO Configuration Wizard")


__Note:__ remove `chromedriver` from the list of services in the generated `wdio.conf.ts` afterwards. See also configuration example below.

For more information on how to install `WebdriverIO`, please check the [project docs](https://webdriver.io/docs/gettingstarted).

## Example Configuration

To use the service you need to add `vscode` to your list of services, optionally followed by a configuration object. This will make WebdriverIO download given VSCode binaries and appropiate Chromedriver version:

```js
// wdio.conf.ts
export const config = {
    outputDir: 'trace',
    // ...
    capabilities: [{
        browserName: 'vscode',
        browserVersion: '1.71.0', // "insiders" or "stable" for latest VSCode version
        'wdio:vscodeOptions': {
            extensionPath: __dirname,
            userSettings: {
                "editor.fontSize": 14
            }
        }
    }],
    services: ['vscode'],
    /**
     * optionally you can define the path WebdriverIO stores all
     * VSCode and Chromedriver binaries, e.g.:
     * services: [['vscode', { cachePath: __dirname }]]
     */
    // ...
};
```

If you define `wdio:vscodeOptions` with any other `browserName` but `vscode`, e.g. `chrome`, the service will serve the extension as web extension. If you test on Chrome no additional driver service is required, e.g.:

```js
// wdio.conf.ts
export const config = {
    outputDir: 'trace',
    // ...
    capabilities: [{
        browserName: 'chrome',
        'wdio:vscodeOptions': {
            extensionPath: __dirname
        }
    }],
    services: ['vscode'],
    // ...
};
```

_Note:_ when testing web extensions you can only choose between `stable` or `insiders` as `browserVersion`.

### TypeScript Setup

In your `tsconfig.json` make sure to add `wdio-vscode-service` to your list of types:

```json
{
    "compilerOptions": {
        "types": [
            "node",
            "webdriverio/async",
            "@wdio/mocha-framework",
            "expect-webdriverio",
            "wdio-vscode-service"
        ],
        "target": "es2019",
        "moduleResolution": "node",
        "esModuleInterop": true
    }
}
```

## Usage

You can then use the `getWorkbench` method to access the page objects for the locators matching your desired VSCode version:

```ts
describe('WDIO VSCode Service', () => {
    it('should be able to load VSCode', async () => {
        const workbench = await browser.getWorkbench()
        expect(await workbench.getTitleBar().getTitle())
            .toBe('[Extension Development Host] - README.md - wdio-vscode-service - Visual Studio Code')
    })
})
```

From there you can access all page objects by using the right page object methods. Find out more about all available page objects and their methods in the [page object docs](https://webdriverio-community.github.io/wdio-vscode-service/).

### Accessing VSCode APIs

If you like to execute certain automation through the [VSCode API](https://code.visualstudio.com/api/references/vscode-api) you can do that by running remote commands via the custom `executeWorkbench` command. This command allows to remote execute code from your test inside the VSCode environment and enables to access the VSCode API. You can pass arbitrary paramaters into the function which will then be propagated into the function. The `vscode` object will be always passed in as first argument following the outer function parameters. Note that you can not access variables outside of the function scoped as the callback is executed remotely. Here is an example:

```ts
const workbench = await browser.getWorkbench()
await browser.executeWorkbench((vscode, param1, param2) => {
    vscode.window.showInformationMessage(`I am an ${param1} ${param2}!`)
}, 'API', 'call')

const notifs = await workbench.getNotifications()
console.log(await notifs[0].getMessage()) // outputs: "I am an API call!"
```

For the full page object documentation, check out the [docs](https://webdriverio-community.github.io/wdio-vscode-service/modules.html). You can find various usage examples in this [projects test suite](https://github.com/webdriverio-community/wdio-vscode-service/blob/main/test/specs/basic.e2e.ts).

## More Information

You can learn more about how to configure the [`wdio-vscode-service`](https://www.npmjs.com/package/wdio-vscode-service) and how create custom page objects in the [service docs](/docs/wdio-vscode-service). You can also watch the following talk by [Christian Bromann](https://twitter.com/bromann) on [_Testing Complex VSCode Extensions With the Power of Web Standards_](https://www.youtube.com/watch?v=PhGNTioBUiU):

<LiteYouTubeEmbed
    id="PhGNTioBUiU"
    title="Testing Complex VSCode Extensions With the Power of Web Standards"
/>
