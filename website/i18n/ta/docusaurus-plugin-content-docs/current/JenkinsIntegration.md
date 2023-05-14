---
id: jenkins
title: Jenkins
---

WebdriverIO [Jenkins](https://jenkins-ci.org)போன்ற CI அமைப்புகளுக்கு இறுக்கமான ஒருங்கிணைப்பை வழங்குகிறது. `junit` ரிப்போர்டர் மூலம், உங்கள் டெஸ்டுகளை எளிதாகப் பிழைத்திருத்தம் செய்யலாம் மற்றும் உங்கள் டெஸ்ட் முடிவுகளைக் கண்காணிக்கலாம். ஒருங்கிணைப்பு மிகவும் எளிதானது.

1. `junit` டெஸ்ட் ரிப்போர்டரை நிறுவவும்: `$ npm install @wdio/junit-reporter --save-dev`)
1. ஜென்கின்ஸ் அவற்றைக் கண்டறியக்கூடிய XUnit முடிவுகளைச் சேமிக்க உங்கள் கட்டமைப்பைப் புதுப்பிக்கவும், (மற்றும் `junit` ரிப்போர்டரை குறிப்பிடவும்):

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

எந்த பிரமேஒர்க்கை தேர்வு செய்வது என்பது உங்களுடையது. அறிக்கைகள் ஒரே மாதிரியாக இருக்கும். இந்த டுடோரியலுக்கு, ஜாஸ்மினைப் பயன்படுத்துவோம்.

நீங்கள் இரண்டு டெஸ்டுகளை எழுதியபிறகு, நீங்கள் ஒரு புதிய ஜென்கின்ஸ் ஜாபை அமைக்கலாம். அதற்கு ஒரு பெயரையும் விளக்கத்தையும் கொடுங்கள்:

![Name And Description](/img/jenkins/jobname.png "Name And Description")

உங்கள் களஞ்சியத்தின் புதிய பதிப்பை அது எப்போதும் உபயோகிக்கிறது என்பதை உறுதிப்படுத்தவும்:

![Jenkins Git Setup](/img/jenkins/gitsetup.png "Jenkins Git Setup")

**Now the important part:** ஷெல் கட்டளைகளை இயக்க `build` உருவாக்கவும். The `build` step needs to build your project. Since this demo project only tests an external app, you don't need to build anything. Just install the node dependencies and run the command `npm test` (which is an alias for `node_modules/.bin/wdio test/wdio.conf.js`).

If you have installed a plugin like AnsiColor, but logs are still not colored, run tests with environment variable `FORCE_COLOR=1` (e.g., `FORCE_COLOR=1 npm test`).

![Build Step](/img/jenkins/runjob.png "Build Step")

After your test, you’ll want Jenkins to track your XUnit report. To do so, you have to add a post-build action called _"Publish JUnit test result report"_.

You could also install an external XUnit plugin to track your reports. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now.

According to the config file, the XUnit reports will be saved in the project’s root directory. These reports are XML files. So, all you need to do in order to track the reports is to point Jenkins to all XML files in your root directory:

![Post-build Action](/img/jenkins/postjob.png "Post-build Action")

That's it! You’ve now set up Jenkins to run your WebdriverIO jobs. Your job will now provide detailed test results with history charts, stacktrace information on failed jobs, and a list of commands with payload that got used in each test.

![Jenkins Final Integration](/img/jenkins/final.png "Jenkins Final Integration")
