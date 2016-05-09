name: jenkins
category: testrunner
tags: guide
index: 7
title: WebdriverIO - Test Runner Jenkins Integration
---

Jenkins Integration
===================

WebdriverIO offers a tight integration to CI systems like [Jenkins](https://jenkins-ci.org/). With the [junit reporter](https://github.com/webdriverio/wdio-junit-reporter) you can easily debug your tests as well as keep track of your test results. The integration is pretty easy. There is a [demo project](https://github.com/christian-bromann/wdio-demo) we used in this tutorial to demonstrate how to integrate a WebdriverIO testsuite with Jenkins.

First we need to define `junit` as test reporter. Also make sure you have it installed (`$ npm install --save-dev wdio-junit-reporter`) and that we save our xunit results at a place where Jenkins can pick them up. Therefore we define our reporter in our config as follows:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: ['dot', 'junit'],
    reporterOptions: {
        junit: {
            outputDir: './'
        }
    },
    // ...
};
```

It is up to you which framework you want to choose. The reports will be similar. This tutorial is going to use Jasmine. After you have written [couple of tests](https://github.com/christian-bromann/wdio-demo/tree/master/test/specs) you can begin to setup a new Jenkins job. Give it a name and a description:

![Name And Description](/images/jenkins-jobname.png "Name And Description")

Then make sure it grabs always the newest version of your repository:

![Jenkins Git Setup](/images/jenkins-gitsetup.png "Jenkins Git Setup")

Now the important part: create a build step to execute shell commands. That build step needs to build your project. Since this demo project only tests an external app we don't need to build anything but install the node dependencies and run our test command `npm test` which is an alias for `node_modules/.bin/wdio test/wdio.conf.js`.

![Build Step](/images/jenkins-runjob.png "Build Step")

After our test we want Jenkins to track our xunit report. To do so we have to add a post-build action called _"Publish JUnit test result report"_. You could also install an external xunit plugin to track your reports. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now.

According to our config file we store the xunit reports in our workspace root directory. These reports are xml files. So all we need to do in order to track the reports is to point Jenkins to all xml files in our root directory:

![Post-build Action](/images/jenkins-postjob.png "Post-build Action")

That's it! This is all you need to setup Jenkins to run your WebdriverIO jobs. The only thing that didn't got mentioned is that Jenkins is setup in a way that it runs Node.js v0.12 and has the [Sauce Labs](https://saucelabs.com/) environment variables set in the settings.

Your job will now provide detailed test results with history charts, stacktrace information on failed jobs as well as a list of commands with payload that got used in each test.

![Jenkins Final Integration](/images/jenkins-final.png "Jenkins Final Integration")
