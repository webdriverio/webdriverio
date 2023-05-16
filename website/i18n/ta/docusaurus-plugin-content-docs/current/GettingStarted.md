---
id: gettingstarted
title: தொடங்குதல்
---

WebdriverIO ஆவணப்படுத்தலுக்கு வரவேற்கிறோம். விரைவாகத் தொடங்க இது உதவும். நீங்கள் சிக்கல்களைச் சந்திக்க நேர்ந்தால், எங்கள் [Discord Support Server](https://discord.webdriver.io) இல் உதவி மற்றும் பதில்களைக் காணலாம் அல்லது [Twitter](https://twitter.com/webdriverio)இல் எங்களை அணுகலாம்.

:::info
WebdriverIO இன் சமீபத்திய பதிப்பின் (__>=8.x__) ஆவணங்கள் இவை. If you are still using an older version, please visit the [old documentation websites](/versions)!
:::

<LiteYouTubeEmbed id="rA4IFNyW54c" title="Getting Started with WebdriverIO" />

:::tip کانال رسمی یوتیوب 🎥

[official YouTube channel](https://youtube.com/@webdriverio)இல் WebdriverIO ஐச் பற்றி மேலும் வீடியோக்களைக் காணலாம். நீங்கள் குழுசேர உறுதி செய்யவும்!

:::

## Initiate a WebdriverIO Setup

To add a full WebdriverIO setup to an existing or new project using the [WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio), run:

If you're in the root directory of an existing project, run:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```

or if you want to create a new project:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```

or if you want to create a new project:

```sh
yarn create wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```

or if you want to create a new project:

```sh
pnpm create wdio ./path/to/new/project
```

</TabItem>
</Tabs>

This single command downloads the WebdriverIO CLI tool and runs a configuration wizard that helps you to configure your test suite.

<CreateProjectAnimation />

The wizard will prompt a set questions that guides you through the setup. You can pass a `--yes` parameter to pick a default set up which will use Mocha with Chrome using the [Page Object](https://martinfowler.com/bliki/PageObject.html) pattern.

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## Run Test

You can start your test suite by using the `run` command and pointing to the WebdriverIO config that you just created:

```sh
npx wdio run ./wdio.conf.js
```

If you like to run specific test files you can add a `--spec` parameter:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

or define suites in your config file and run just the test files defined by in a suite:

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## Run in a script

If you would like to use WebdriverIO as an automation engine in [Standalone Mode](/docs/setuptypes#standalone-mode) within a Node.JS script you can also directly install WebdriverIO and use it as a package, e.g. to generate a screenshot of a website:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__Note:__ all WebdriverIO commands are asynchronous and need to be properly handled using [`async/await`](https://javascript.info/async-await).

## Record tests

WebdriverIO provides tools to help you get started by recording your test actions on screen and generate WebdriverIO test scripts automatically. See [Recorder tests with Chrome DevTools Recorder](/docs/record) for more information.

## System Requirements

You’ll need [Node.js](http://nodejs.org) installed.

- Install at least v16.x or higher as this is the oldest active LTS version
- Only releases that are or will become an LTS release are officially supported

If Node is not currently installed on your system, we suggest utilizing a tool such as [NVM](https://github.com/creationix/nvm) or [Volta](https://volta.sh/) to assist in managing multiple active Node.js versions. NVM is a popular choice, while Volta is also a good alternative.
