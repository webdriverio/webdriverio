---
id: protractor-migration
title: From Protractor
---

This tutorial is for people who are using Protractor and want to migrate their framework to WebdriverIO. It was initiated after the Angular team [has announced](https://github.com/angular/protractor/issues/5502) that Protractor won't be longer supported. WebdriverIO has been influenced by a lot of Protractors design decisions which is why it is probably the closest framework to migrate over. The WebdriverIO team appreciates the work of every single Protractor contributor and hopes that this tutorial makes the transition to WebdriverIO easy and straightforward.

While we would love to have a fully automated process for this the reality looks different. Everyone has a different setup and uses Protractor in different ways. Every step should be seen as guidance and less like a step by step instruction. If you have issues with the migration, don't hesitate to [contact us](https://github.com/webdriverio/codemod/discussions/new).

## Setup

The Protractor and WebdriverIO API is actually very similar, to a point where the majority of commands can be rewritten in an automted way through a [codemod](https://github.com/webdriverio/codemod).

To install the codemod, run:

```sh
npm install jscodeshift @wdio/codemod
```

## Strategy

There are many migration strategies. Depending on the size of your team, amount of test files and the urgency to migrate you can try to transform all tests at once or file by file. Given that Protractor will continued to be maintained until Angular version 15 (end of 2022) you still have enough time. You can have Protractor and WebdriverIO tests running at the same time and start writing new tests in WebdriverIO. Given your time budget you can then start migrating the important test cases first and work your way down to tests you might even can delete.

## First the Config File

After we have installed the codemod we can start transforming the first file. Have a look first into [WebdriverIOs configuration options](Configuration.md). Config files can become very complex and it might make sense to only port the essential parts and see how the rest can be added once the corresponding tests that need certain options are being migrated.

For the first migration we only transform the config file and run:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./conf.ts
```

:::info

 Your config can be named differently, however the principle should be the same: start migration the config first.

:::

## Install WebdriverIO Dependencies

Next step is to configure a minimal WebdriverIO setup that we start building up as we migrate from one framework to another. First we install the WebdriverIO CLI via:

```sh
npm install --save-dev @wdio/cli
```

Next we run the configuration wizard:

```sh
npx wdio config
```

This will walk you through a couple of questions. For this migration scenario you:
- pick the default choices
- we recommend not to auto-generate example files
- pick a different folder for WebdriverIO files
- and to choose Mocha above Jasmine.

:::info Why Mocha?
Even though you might have been using Protractor with Jasmine before, Mocha however provides better retry mechanisms. The choice is yours!
:::

After the little questionaire the wizard will install all necessary packages and stores them in your `package.json`.

## Migrate Configuration File

After we have a transformed `conf.ts` and a new `wdio.conf.ts`, it is now time to migrate the configuration from one config to another. Make sure to only port code that is essential for all tests to be able to run. In ours we port the hook function and framework timeout.

We will now continue with our `wdio.conf.ts` file only and therefore won't need any changes to the original Protractor config anymore. We can revert those so that both frameworks can run next to each other and we can port on file at the time.

## Migrate Test File

We are now set to port over the first test file. To start simple, let's start with one that has not many dependencies to 3rd party packages or other files like PageObjects. In our example the first file to migrate is `first-test.spec.ts`. First create the directory where the new WebdriverIO configuration expects its files and then move it over:

```sh
mv mkdir -p ./test/specs/
mv test-suites/first-test.spec.ts ./test/specs
```

Now let's transform this file:

```sh
npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./test/specs/first-test.spec.ts
```

That's it! This file is so simple that we don't need any additional changes anymore and directly can try to run WebdriverIO via:

```sh
npx wdio run wdio.conf.ts
```

Congratulations 🥳 you just migrated the first file!

## Next Steps

From this point you continue to transform test by test and page object by page object. There are chances that the codemod will fail for certain files with an error such as:

```
ERR /path/to/project/test/testdata/failing_submit.js Transformation error (Error transforming /test/testdata/failing_submit.js:2)
Error transforming /test/testdata/failing_submit.js:2

> login_form.submit()
  ^

The command "submit" is not supported in WebdriverIO. We advise to use the click command to click on the submit button instead. For more information on this configuration, see https://webdriver.io/docs/api/element/click.
  at /path/to/project/test/testdata/failing_submit.js:132:0
```

For some Protractor commands there is just no replacement for it in WebdriverIO. In this case the codemod will give you some advice how to refactor it. If you stumble upon such error messages too often, feel free to [raise an issue](https://github.com/webdriverio/codemod/issues/new) and request to add a certain transformation. While the codemod already transforms the majority of the Protractor API there is still a lot of room for improvements.

## Conclusion

We hope this tutorial guides you a little bit through the migration process to WebdriverIO. The community continues to improve the codemod while testing it with various teams in various organisations. Don't hesitate to [raise an issue](https://github.com/webdriverio/codemod/issues/new) if you have feedback or [start a discussion](https://github.com/webdriverio/codemod/discussions/new) if you struggle during the migration process.
