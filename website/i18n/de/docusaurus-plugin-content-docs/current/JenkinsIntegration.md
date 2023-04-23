---
id: jenkins
title: Jenkins
---

WebdriverIO bietet eine enge Integration in CI-Systeme wie [Jenkins](https://jenkins-ci.org). Mit dem `junit` Reporter können Sie Ihre Tests einfach debuggen und Ihre Testergebnisse verfolgen. Die Integration ist ziemlich einfach.

1. Installieren Sie den JUnit-Testreporter: `$ npm install @wdio/junit-reporter --save-dev`)
1. Aktualisieren Sie Ihre Konfiguration, um Ihre JUnit-Ergebnisse dort zu speichern, wo Jenkins sie finden kann, (und geben Sie den Reporter `junit` an):

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

Welches Framework Sie wählen, bleibt Ihnen überlassen. Die JUnit-Reports werden ähnlich sein. Für dieses Tutorial verwenden wir Jasmine.

Nachdem Sie einige Tests geschrieben haben, können Sie einen neuen Jenkins-Job einrichten. Geben Sie ihm einen Namen und eine Beschreibung:

![Name And Description](/img/jenkins/jobname.png "Name And Description")

Stellen Sie dann sicher, dass immer die neueste Version Ihres Repositorys abgerufen wird:

![Jenkins Git Setup](/img/jenkins/gitsetup.png "Jenkins Git Setup")

**Now the important part:** Create a `build` step to execute shell commands. The `build` step needs to build your project. Since this demo project only tests an external app, you don't need to build anything. Just install the node dependencies and run the command `npm test` (which is an alias for `node_modules/.bin/wdio test/wdio.conf.js`).

If you have installed a plugin like AnsiColor, but logs are still not colored, run tests with environment variable `FORCE_COLOR=1` (e.g., `FORCE_COLOR=1 npm test`).

![Build Step](/img/jenkins/runjob.png "Build Step")

After your test, you’ll want Jenkins to track your XUnit report. To do so, you have to add a post-build action called _"Publish JUnit test result report"_.

You could also install an external XUnit plugin to track your reports. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now.

According to the config file, the XUnit reports will be saved in the project’s root directory. These reports are XML files. So, all you need to do in order to track the reports is to point Jenkins to all XML files in your root directory:

![Post-build Action](/img/jenkins/postjob.png "Post-build Action")

That's it! You’ve now set up Jenkins to run your WebdriverIO jobs. Your job will now provide detailed test results with history charts, stacktrace information on failed jobs, and a list of commands with payload that got used in each test.

![Jenkins Final Integration](/img/jenkins/final.png "Jenkins Final Integration")
