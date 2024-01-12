---
id: gettingstarted
title: Getting Started
---

Welcome to the WebdriverIO documentation. It will help you to get started fast. If you run into problems, you can find help and answers on our [Discord Support Server](https://discord.webdriver.io) or you can hit me on [Twitter](https://twitter.com/webdriverio).

:::info
These are the docs for the latest version (__>=8.x__) of WebdriverIO. If you are still using an older version, please visit the [old documentation websites](/versions)!
:::

<LiteYouTubeEmbed
    id="rA4IFNyW54c"
    title="Getting Started with WebdriverIO"
/>

:::tip Official YouTube Channel 🎥

You can find more videos around WebdriverIO on the [official YouTube channel](https://youtube.com/@webdriverio). Make sure you subscribe!

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
    {label: 'bun', value: 'bun'},
  ]
}>
<TabItem value="npm">

```sh
npm init wdio@latest .
```

or if you want to create a new project:

```sh
npm init wdio@latest ./path/to/new/project
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
pnpm create wdio@latest .
```

or if you want to create a new project:

```sh
pnpm create wdio@latest ./path/to/new/project
```

</TabItem>
<TabItem value="bun">

```sh
bun create wdio@latest .
```

or if you want to create a new project:

```sh
bun create wdio@latest ./path/to/new/project
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
    {label: 'bun', value: 'bun'},
  ]
}>
<TabItem value="npm">

```sh
npm init wdio@latest . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio@latest . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
bun create wdio@latest . --yes
```

</TabItem>
</Tabs>

## Install CLI Manually

You can also add the CLI package to your project manually via:

```sh
npm i --save-dev @wdio/cli
npx wdio --version # prints e.g. `8.13.10`

# run configuration wizard
npx wdio config
```

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
