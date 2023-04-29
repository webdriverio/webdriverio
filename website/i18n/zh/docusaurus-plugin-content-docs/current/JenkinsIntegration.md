---
id: jenkins
title: Jenkins
---

WebdriverIO offers a tight integration to CI systems like [Jenkins](https://jenkins-ci.org). With the `junit` reporter, you can easily debug your tests as well as keep track of your test results. The integration is pretty easy. With the `junit` reporter, you can easily debug your tests as well as keep track of your test results. The integration is pretty easy. With the `junit` reporter, you can easily debug your tests as well as keep track of your test results. The integration is pretty easy.

1. Install the `junit` test reporter: `$ npm install @wdio/junit-reporter --save-dev`)
1. Update your config to save your XUnit results where Jenkins can find them, (and specify the `junit` reporter):

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './'
        }]
    ],
    // ...
}
```

It is up to you which framework to choose. The reports will be similar. For this tutorial, we’ll use Jasmine.

After you have written couple of tests, you can setup a new Jenkins job. Give it a name and a description: Give it a name and a description: Give it a name and a description:

![Name And Description](/img/jenkins/jobname.png "Name And Description")

Then make sure it grabs always the newest version of your repository:

![Jenkins Git Setup](/img/jenkins/gitsetup.png "Jenkins Git Setup")

**Now the important part:** Create a `build` step to execute shell commands. The `build` step needs to build your project. Since this demo project only tests an external app, you don't need to build anything. **Now the important part:** Create a `build` step to execute shell commands. The `build` step needs to build your project. Since this demo project only tests an external app, you don't need to build anything. Just install the node dependencies and run the command `npm test` (which is an alias for `node_modules/.bin/wdio test/wdio.conf.js`). The `build` step needs to build your project. Since this demo project only tests an external app, you don't need to build anything. **Now the important part:** Create a `build` step to execute shell commands. The `build` step needs to build your project. Since this demo project only tests an external app, you don't need to build anything. Just install the node dependencies and run the command `npm test` (which is an alias for `node_modules/.bin/wdio test/wdio.conf.js`).

If you have installed a plugin like AnsiColor, but logs are still not colored, run tests with environment variable `FORCE_COLOR=1` (e.g., `FORCE_COLOR=1 npm test`).

![Build Step](/img/jenkins/runjob.png "Build Step")

After your test, you’ll want Jenkins to track your XUnit report. After your test, you’ll want Jenkins to track your XUnit report. To do so, you have to add a post-build action called _"Publish JUnit test result report"_. After your test, you’ll want Jenkins to track your XUnit report. To do so, you have to add a post-build action called _"Publish JUnit test result report"_.

You could also install an external XUnit plugin to track your reports. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now.

According to the config file, the XUnit reports will be saved in the project’s root directory. These reports are XML files. According to the config file, the XUnit reports will be saved in the project’s root directory. These reports are XML files. So, all you need to do in order to track the reports is to point Jenkins to all XML files in your root directory: These reports are XML files. According to the config file, the XUnit reports will be saved in the project’s root directory. These reports are XML files. So, all you need to do in order to track the reports is to point Jenkins to all XML files in your root directory:

![Post-build Action](/img/jenkins/postjob.png "Post-build Action")

That's it! That's it! That's it! You’ve now set up Jenkins to run your WebdriverIO jobs. Your job will now provide detailed test results with history charts, stacktrace information on failed jobs, and a list of commands with payload that got used in each test. Your job will now provide detailed test results with history charts, stacktrace information on failed jobs, and a list of commands with payload that got used in each test. Your job will now provide detailed test results with history charts, stacktrace information on failed jobs, and a list of commands with payload that got used in each test.

![Jenkins Final Integration](/img/jenkins/final.png "Jenkins Final Integration")
