---
title: WebdriverIO V5 now also supports CucumberJS
author: Wim Selles
authorURL: http://github.com/wswebcreation
authorImageURL: https://avatars2.githubusercontent.com/u/11979740?s=460&v=4
---

We are pleased to announce that we now have support for CucumberJS in WebdriverIO V5!!!! 
This has been a great challenge for the projectcommitters so we're all very thankful for the time and effort they put into this.
So normally we would say

    npm install @wdio/cucumber-framework --save-dev
    
and go with the flow, but this time it is different. When you upgrade to the latest version of the Cucumber framework you also need to upgrade to the **latest version of WebdriverIO**. 
In this blog post we want to give you some guidelines on how to do that.

## Where to start
Upgrading to the latest version of the Cucumber framework isn't that simple, because as said, you also need to migrate to version 5 of WebdriverIO.
To understand what you need to do we have created some steps you might want to follow which will make the migration a lot easier for you. 
But before we explain the steps, you first need to understand the differences between WebdriverIO V4 and WebdriverIO V5

### W3C support
WebdriverIO is now fully supporting the W3C protocol, this has a lot of advantages, but for your existing scripts some minor downsides. 
One of the downsides might be that you are using methods that are based on the JSONWire Protocol, that are not supported by the newest drivers like for example ChromeDriver 74+.
This might result in errors like for example `browser.positionClick() is not a function`. If you see this error you are using a not supported method for the W3C supported Driver. 
See the API documentation [here](https://webdriver.io/docs/api.html) to see which command is a Webdriver Protocol (W3C) or a JSONWire protocol command.
If you want to use W3C with cloud vendors, like for example Sauce Labs or Browserstack, you need to use a vendor specific prefix in your capabilities.
Please check the websites of the vendors to see what you need to do

### Command changes: 
Over the years WebdriverIO added more and more commands for different automation protocols without applying a pattern to it which resulted in having a bunch of duplication and inconsistent naming.
Even though the list looks exhausting, most of the commands that have changed were used internally. Please check the [changelog of V5](https://github.com/webdriverio/webdriverio/blob/master/CHANGELOG.md#v500-2018-12-20) to see all the changes. 

### Breaking changes
When creating a better product and thus releasing a major version, you will always have breaking changes. We can't repeat it enough but please check the [changelog of V5](https://github.com/webdriverio/webdriverio/blob/master/CHANGELOG.md#v500-2018-12-20) to see all the breaking changes. 

**Don't only read the changes in the V5.0.0 release, but also read the rest of the changes!**

### It's not only WebdriverIO who evolved!
When you are going to use the lastest version of the `@wdio/cucumer-framework`, you'll also get the latest version of Cucumber. **This means you also need to look at the breaking changes between CucumberJS 2 and CucumberJS 5.**
Please check the [changelog of CucumberJS](https://github.com/cucumber/cucumber-js/blob/master/CHANGELOG.md#300-2017-08-08) from version 3 till 5 to see what changed in CucumberJS

### Migration steps
So enough about the differences between V4 and V5, please follow the steps below to make the migration a little bit smoother. The idea behind these steps is to migrate with small baby steps. 
The advantage of doing it in small baby steps is that you also have some time to look at your code again and maybe refactor it or remove duplicate and or ugly not needed code.

#### 1. Start with a clean project
We advise you to create a fresh new project which you can easily copy to your old project and migrate 1 feature file and it's steps per scenario.
When you do this you can easily disable scenario's in your old project, and run the new migrated tests in the new project, maybe even embed it in your pipeline.

Before installing dependencies, we need to initialize an empty NPM project (this will allow us to the cli to install needed dependencies to our local project).
To do this, run:

    mkdir webdriverio-test && cd webdriverio-test
    npm init -y

The `-y` will answer 'yes' to all the prompts, giving us a standard NPM project. Feel free to omit the `-y` if you'd like to specify your own project details.

#### 2. Install WebdriverIO CLI
We recommend using the test runner because it comes with a lot of useful features that makes your life easier. With WebdriverIO v5 and up, the testrunner has moved into the [@wdio/cli](https://www.npmjs.com/package/@wdio/cli) NPM package.

Now we need to install the cli. Do that by running:

    npm i --save-dev @wdio/cli

#### 3. Generate Configuration File
We'll next want to generate a configuration file that stores all of our WebdriverIO settings. To do that just run the configuration utility:

    ./node_modules/.bin/wdio config
    
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
Because you created a clean project you can now easily do the following.

1. Remove all WebdriverIO V4 dependencies in your old project.
2. Copy all dependencies from the new project to the old project
3. Remove all testrelated files
4. Copy all new testrelated files to your project

And you're done, time to party.

# Support
If you need support you can find us on the `WebdriverIO`- Gitter channel by clicking on this link [![Gitter chat](https://badges.gitter.im/webdriverio/webdriverio.svg)](https://gitter.im/webdriverio/webdriverio "Gitter chat"). 
When you ask for support we only have 1 question for you, please provide us a detailed description of your issue, what you already did and so on. Otherwise you ask us to find a needle in a haystack and trust me, that will be very hard for us.

Happy testing!

Grtz,

The Blue Guy
