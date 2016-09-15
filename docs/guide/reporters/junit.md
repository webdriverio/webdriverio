name: junit
category: reporters
tags: guide
index: 2
title: WebdriverIO - JUnit Reporter
---

JUnit Reporter
==============

The JUnit reporter helps you to create sophisticated reports for your CI server. To use it just install it from NPM:

```js
$ npm install wdio-junit-reporter --save-dev
```

Then add it to the `reporters` array in your wdio.conf.js and define the directory where the xml files should get stored:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: ['spec', 'junit'],
    reporterOptions: {
        junit: {
            outputDir: './'
        }
    },
    // ...
};
```

WebdriverIO will create for each instance a single report file. The XML will contain all necessary information you need to debug your test:

```xml
<!-- WDIO.xunit.safari.5_1.osx10_6.64814.xml -->
<testsuites name="safari-osx 10_6-5_1" tests="9" failures="0" errors="0" disabled="0" time="23.385">
  <testsuite name="webdriver.io page should have the right title" tests="3" failures="0" skipped="0" disabled="0" time="17.053" timestamp="Fri Jun 26 2015 14:19:37 GMT+0200 (CEST)" id="1" file="/Users/christianbromann/Sites/projects/webdriverio/DEV/examples/runner-specs/mocha.test.js">
      <testcase name="the good old callback way" disabled="false" time="9.848" id="4" file="/Users/christianbromann/Sites/projects/webdriverio/DEV/examples/runner-specs/mocha.test.js" status="passed">
          <system-out type="command"><![CDATA[
POST http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/url - {"url":"http://webdriver.io/"}
GET http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/title - {}
]]></system-out>
          <system-out type="result"><![CDATA[
POST http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/url - {"status":0,"orgStatusMessage":"The command executed successfully."}
GET http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/title - {"status":0,"state":null,"value":"WebdriverIO - Selenium 2.0 javascript bindings for nodejs","sessionId":"3f1c00dc831f49698a50a793ca3049d9","hCode":1473790157,"class":"org.openqa.selenium.remote.Response"}
]]></system-out>
      </testcase>
      <testcase name="the promise way" disabled="false" time="3.656" id="7" file="/Users/christianbromann/Sites/projects/webdriverio/DEV/examples/runner-specs/mocha.test.js" status="passed">
          <system-out type="command"><![CDATA[
POST http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/url - {"url":"http://webdriver.io/"}
GET http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/title - {}
]]></system-out>
          <system-out type="result"><![CDATA[
POST http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/url - {"status":0,"orgStatusMessage":"The command executed successfully."}
GET http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/title - {"status":0,"state":null,"value":"WebdriverIO - Selenium 2.0 javascript bindings for nodejs","sessionId":"3f1c00dc831f49698a50a793ca3049d9","hCode":139032836,"class":"org.openqa.selenium.remote.Response"}
]]></system-out>
      </testcase>
      <testcase name="the fancy generator way" disabled="false" time="3.549" id="9" file="/Users/christianbromann/Sites/projects/webdriverio/DEV/examples/runner-specs/mocha.test.js" status="passed">
          <system-out type="command"><![CDATA[
POST http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/url - {"url":"http://webdriver.io/"}
GET http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/title - {}
DELETE http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9 - {}
]]></system-out>
          <system-out type="result"><![CDATA[
POST http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/url - {"status":0,"orgStatusMessage":"The command executed successfully."}
GET http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9/title - {"status":0,"state":null,"value":"WebdriverIO - Selenium 2.0 javascript bindings for nodejs","sessionId":"3f1c00dc831f49698a50a793ca3049d9","hCode":234367668,"class":"org.openqa.selenium.remote.Response"}
DELETE http://ondemand.saucelabs.com:80/wd/hub/session/3f1c00dc831f49698a50a793ca3049d9 - {"status":0,"sessionId":"3f1c00dc831f49698a50a793ca3049d9","value":""}
]]></system-out>
      </testcase>
  </testsuite>
</testsuites>
```

This enables an excellent integration with CI systems like Jenkins. Check out the [Jenkins Integration](/guide/testrunner/jenkins.html) section to learn more about how to integrate WebdriverIO with Jenkins.
