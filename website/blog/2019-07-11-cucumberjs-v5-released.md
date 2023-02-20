---
title: WebdriverIO V5 now also supports CucumberJS
author: Wim Selles
authorURL: http://github.com/wswebcreation
authorImageURL: https://avatars2.githubusercontent.com/u/11979740?s=460&v=4
---

We are pleased to announce that we now have support for CucumberJS in WebdriverIO V5!!!!
This has been a great challenge for the project committers so we're all very thankful for the time and effort they put into this.
So normally we would say

```sh
npm install @wdio/cucumber-framework --save-dev
```

and go with the flow, but this time it is different. When you upgrade to the latest version of the Cucumber framework you also need to upgrade to the **latest version of WebdriverIO**.
In this blog post we want to give you some guidelines on how to do that.

## Where to start
Upgrading to the latest version of the Cucumber framework isn't that simple, because as said, you also need to migrate to version 5 of WebdriverIO.
To understand what you need to do we have created some steps you might want to follow which will make the migration a lot easier for you.
But before we explain the steps, you first need to understand the differences between WebdriverIO V4 and WebdriverIO V5.

### NodeJS support
WebdriverIO now needs NodeJS 8 or higher. Be aware that NodeJS 8 will end it's LTS support at the end of 2019, so upgrading to 10 would be better.
If you want to know more about the NodeJS LTS support check [this](https://github.com/nodejs/Release). This might help you convince your colleagues / DEVOPS engineers to upgrade you NodeJS instances.

*As a side note, if you want to know what is supported by NodeJS by default you can check [node.green](https://node.green/) and follow all upcoming changes.*

### W3C support
WebdriverIO is now fully supporting the W3C protocol, this has a lot of advantages, but for your existing scripts some minor downsides.
One of the downsides might be that you are using methods that are based on the JSONWire Protocol, that are not supported by the newest drivers like for example ChromeDriver 74+.
This might result in errors like for example `browser.positionClick() is not a function`. If you see this error you are using a not supported method for the W3C supported Driver.
See the API documentation [here](https://webdriver.io/docs/api.html) to see which command is a WebDriver Protocol (W3C) or a JSONWire protocol command.

Just a little side note, we tried to keep all `browser` and `element` commands, see the link above, agnostic to the protocol. Nothing changed here for you.
To provide you some insight on how this works please check for example the `keys` command, you will find the support for both protocols [here](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/src/commands/browser/keys.js#L45-L50).

If you want to use W3C with cloud vendors, like for example Sauce Labs or Browserstack, you need to use a vendor specific prefix in your capabilities.
Please check the websites of the vendors to see what you need to do.

But, you always need to end with the advantages. So, with W3C you will now see that the browsers follow a common web standard for web automation.
This helps WebdriverIO to build a reliable framework on top of it. And last but not least, with W3C support from all browser vendors we now also get better support for Appium, check the latest post of [Apple here](https://webkit.org/blog/9395/webdriver-is-coming-to-safari-in-ios-13/).
So, W3C is a major step for us all!!

### Command changes
Over the years WebdriverIO added more and more commands for different automation protocols without applying a pattern to it which resulted in having a bunch of duplication and inconsistent naming.
Even though the list looks exhausting, most of the commands that have changed were used internally. Please check the [changelog of V5](https://github.com/webdriverio/webdriverio/blob/main/CHANGELOG.md#v500-2018-12-20) to see all the changes.

### Breaking changes
When creating a better product and thus releasing a major version, you will always have breaking changes. We can't repeat it enough but please check the [changelog of V5](https://github.com/webdriverio/webdriverio/blob/main/CHANGELOG.md#v500-2018-12-20) to see all the breaking changes.

**Don't only read the changes in the V5.0.0 release, but also read the rest of the changes!**

### It's not only WebdriverIO who evolved!
When you are going to use the latest version of the `@wdio/cucumber-framework`, you'll also get the latest version of Cucumber. **This means you also need to look at the breaking changes between CucumberJS 2 and CucumberJS 5.**
Please check the [changelog of CucumberJS](https://github.com/cucumber/cucumber-js/blob/master/CHANGELOG.md#300-2017-08-08) from version 3 till 5 to see what changed in CucumberJS.

### Migration steps
So enough about the differences between V4 and V5, please follow the steps below to make the migration a little bit smoother. The idea behind these steps is to migrate with small baby steps.
The advantage of doing it in small baby steps is that you also have some time to look at your code again and maybe refactor it or remove duplicate and ugly not needed code.

#### 1. Start with a clean project
We advise you to create a fresh new project which you can easily copy to your old project and migrate 1 feature file and it's steps per scenario.
When you do this you can easily disable scenario's in your old project, and run the new migrated tests in the new project, maybe even embed it in your pipeline.

Before installing dependencies, we need to initialize an empty NPM project (this will allow us to the cli to install needed dependencies to our local project).
To do this, run:

```sh
mkdir webdriverio-test && cd webdriverio-test
npm init -y
```

The `-y` will answer 'yes' to all the prompts, giving us a standard NPM project. Feel free to omit the `-y` if you'd like to specify your own project details.

#### 2. Install WebdriverIO CLI
We recommend using the test runner because it comes with a lot of useful features that makes your life easier. With WebdriverIO v5 and up, the testrunner has moved into the [@wdio/cli](https://www.npmjs.com/package/@wdio/cli) NPM package.

Now we need to install the cli. Do that by running:

```sh
npm i --save-dev @wdio/cli
```

#### 3. Generate Configuration File
We'll next want to generate a configuration file that stores all of our WebdriverIO settings. To do that just run the configuration utility:

```sh
npx wdio config
```

A question interface pops up. It will help to create the config easy and fast and install all needed dependencies.
Check the file and read the comments, some things changed so reading them might help you understand what changed in the configuration file.

**NOTE:**
If you were using a compiler in your `cucumberOpts` you need to be aware of the fact that CucumberJS removed the `compiler`. This means that WebdriverIO can't provide you with this option, but, as you might expect from our hard working contributors, there is a different solution.
Please check [Babel](https://webdriver.io/docs/babel.html) or [TypeScript](https://webdriver.io/docs/typescript.html) for the new way of using a compiler.

#### 4. Create the same folder structure
Now that everything has been set up, it's best to create the same folder structure you now have in your project.

**DON'T COPY THE FILE, ONLY THE FOLDER STRUCTURE**

#### 5. Migrate feature file per feature file
When you have the folder structure, copy **1 feature file** to the new project. Start with the easiest file and if you have more than 1 scenario in it, comment out all scenario's and leave 1 active.
Now make sure you migrate the steps that belong to that specific scenario, including all pageobjects that belong to the implementation, to the new project. Keep in mind that there are breaking changes in WebdriverIO in selecting elements and so on, see above.
If you were using the `defineSupportCode` from CucumberJS, please check the [CucumberJS changelog for V4](https://github.com/cucumber/cucumber-js/blob/master/CHANGELOG.md#400-2018-01-24). That is deprecated now.

Do this for each scenario, migrate it step by step, if you face issues, fix them and proceed. And don't forget to clean up the coding mess you, or your colleagues, might have made in the past.

#### 6. When you're done
Because you created a clean project you can now easily do the following:

1. Remove all WebdriverIO V4 dependencies in your old project.
2. Copy all dependencies from the new project to the old project.
3. Remove all test related files.
4. Copy all new test related files to your project.

And you're done, time to party.

# Support
If you need support you can find help in the community [Matrix](https://matrix.to/#/#webdriver.io:gitter.im) channel. When you ask for support we only have 1 question for you, please provide us a detailed description of your issue, what you already did and so on. Otherwise you ask us to find a needle in a haystack and trust me, that will be very hard for us.

Happy testing!

Grtz,

The Blue Guy
