---
id: bamboo
title: बांस
---

WebdriverIO सीआई सिस्टम जैसे [बांस](https://www.atlassian.com/software/bamboo)के लिए एक सख्त एकीकरण प्रदान करता है। [JUnit](https://webdriver.io/docs/junit-reporter.html) या [Allure](https://webdriver.io/docs/allure-reporter.html) रिपोर्टर के साथ, आप आसानी से अपने परीक्षणों को डिबग कर सकते हैं और साथ ही अपने परीक्षा परिणामों पर नज़र रख सकते हैं। एकीकरण बहुत आसान है।

1. JUnit परीक्षण रिपोर्टर इंस्टाल करें: `$ npm install @wdio/junit-reporter --save-dev`)
1. अपने JUnit परिणामों को सहेजने के लिए अपनी कॉन्फ़िगरेशन अपडेट करें जहां बांस उन्हें ढूंढ सकता है, (और `junit` रिपोर्टर निर्दिष्ट करें):

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/'
        }]
    ],
    // ...
}
```
नोट: *परीक्षण परिणामों को रूट फ़ोल्डर की तुलना में अलग फ़ोल्डर में रखना हमेशा एक अच्छा मानक होता है।*

```js
// wdio.conf.js - For tests running in parallel
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/',
            outputFileFormat: function (options) {
                return `results-${options.cid}.xml`;
            }
        }]
    ],
    // ...
}
```

रिपोर्ट सभी फ्रेमवर्क के लिए समान होंगी और आप किसी का भी उपयोग कर सकते हैं: मोचा, जेसमीन या कुकुम्बर।

By this time, we believe you have the tests written up and results are generated in `./testresults/` folder, and your Bamboo is up and running.

## Integrate your tests in Bamboo

1. Open your Bamboo project

    > Create a new plan, link your repository (make sure it always points to newest version of your repository) and create your stages

    ![Plan Details](/img/bamboo/plancreation.png "Plan Details")

    I will go with the default stage and job. In your case, you can create your own stages and jobs

    ![Default Stage](/img/bamboo/defaultstage.png "Default Stage")
2. Open your testing job and create tasks to run your tests in Bamboo
> **Task 1:** Source Code Checkout
> **Task 2:** Run your tests `npm i && npm run test`. You can use *Script* task and *Shell Interpreter* to run the above commands (This will generate the test results and save them in `./testresults/` folder)

    ![Test Run](/img/bamboo/testrun.png "Test Run")
> **Task: 3** Add *jUnit Parser* task to parse your saved test results. Please specify the test results directory here (you can use Ant style patterns as well)

    ![jUnit Parser](/img/bamboo/junitparser.png "jUnit Parser")

    Note: *Make sure you are keeping the results parser task in *Final* section, so that it always get executed even if your test task is failed*
> **Task: 4** (optional) In order to make sure that your test results are not messed up with old files, you can create a task to remove the `./testresults/` folder after a successful parse to Bamboo. You can add a shell script like `rm -f ./testresults/*.xml` to remove the results or `rm -r testresults` to remove the complete folder

Once the above *rocket science* is done, please enable the plan and run it. Your final output will be like:

## Successful Test

![Successful Test](/img/bamboo/successfulltest.png "Successful Test")

## Failed Test

![Failed Test](/img/bamboo/failedtest.png "Failed Test")

## Failed and Fixed

![Failed and Fixed](/img/bamboo/failedandfixed.png "Failed and Fixed")

Yay!! That's all. You have successfully integrated your WebdriverIO tests in Bamboo.
