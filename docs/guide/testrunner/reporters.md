name: reporters
category: testrunner
tags: guide
index: 3
title: WebdriverIO - Test Runner Reporters
---

Reporters
=========

WebdriverIO provides three different reporters you can use to get an overview about your test results.
Choose between `dot` (default), `spec` or `xunit`, either by adding: `reporter: '...'` to your
config file or by adding `-r ...` to the command line.

## Dot Reporter

The dot reporter prints for each test spec a dot. If colors are enabled on your machine you will see
three different colors for dots. Yellow dots mean that at least one browser has executed that spec.
A green dot means all browser passed that spec and a red to means that at least one browser failed
that spec.

![Dot Reporter](/images/dot.png "Dot Reporter")

## Spec Reporter

Like in most common test frameworks the spec reporter outputs a hierarchical view nested just as the
test cases are. The WebdriverIO specs reporter additionally prints how many instances have run that
test.

![Spec Reporter](/images/spec.png "Spec Reporter")

If a test in one instance fails, both reporters (dot and spec) tell you which instance (with browser name,
version and platform information) failed the test. Thanks to the monadic core structure of WebdriverIO,
all stacktraces will contain useful information and don't confuse you with endlessly long useless file
references.

Here is an example of a test that fails in one spec. As you can see the test fails in Chrome for a
different reason then in Firefox and Safari. If you are using Sauce Labs, WebdriverIO also provides the
link to the test.

![A Failing Test](/images/failing-test.png "A Failing Test")

## Xunit Reporter

The xunit reporter helps you to create sophisticated reports for your CI server. These reports are XML
files which are stored in the location you define in your config file. Therefore please set
a proper directory where you want your reports saved:

```js
reporterOptions: {
    outputDir: '/path/to/reports/'
}
```

WebdriverIO will create for each instance a single report file. The XML will contain all necessary
information you need to debug your test:

```xml WDIO.xunit.safari.5_1.osx10_6.64814.xml
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

This enables an excellent integration with CI systems like Jenkins. Check out the [Jenkins Integration](/guide/testrunner/jenkins.html)
section to learn more about how to integrate WebdriverIO with Jenkins.
