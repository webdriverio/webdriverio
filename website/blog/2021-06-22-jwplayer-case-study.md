---
title: Case Study - How WebdriverIO facilitated faster releases and better code quality for an online video company
author: Eric Saari
authorURL: https://www.linkedin.com/in/esaari/
authorImageURL: https://avatars.githubusercontent.com/u/5210550?s=400&u=a7918ea7b425d621b2252f6e963b8657acdd1b0c&v=4
---

## Choosing WebdriverIO

[JW Player](https://www.jwplayer.com) is an embeddable, online video player which generates over a billion unique views every day. In order to sustain and grow this scale, the player needs to be able to function on a multitude of different web and mobile platforms. This increases the importance of automated testing to improve confidence in our releases when deploying to so many different targets. After a lengthy project of converting our legacy test framework, which comprised over 6,000 tests, the Test Engineering team at JW Player has been able to deliver more timely releases with fewer regressions. We have experienced no major rollbacks, and increased the confidence we have in the quality of our own product, thanks to WebdriverIO.

Before our migration to WebdriverIO, we had been using an open sourced Ruby framework on top of Cucumber. JW Player is officially supported on seven desktop and mobile web browsers, as well as iOS and Android versions dating back to 10 and 4.4, respectively. For coverage of these platforms, we run approximately 25,000 UI acceptance tests on a nightly basis. The legacy implementation created two problems. First, we encountered performance limitations in Ruby, as a single test run across all platforms could take up to 9 hours. Second, as the Player is implemented in JavaScript, product engineers were less likely to embrace and contribute to the Ruby-based framework. Moving to a JavaScript-native framework addressed both of these problems.

Selenium Webdriver has long been the go-to standard for web automation. Around 2018, our team began to explore several new emerging testing technologies. Cypress had limited browser support, Microsoft Playwright had not yet even been released, and Puppeteer would only execute on Chrome. A Webdriver-based solution, with its broad and dedicated support amongst browser vendors, was the clear winner.

What initially attracted us to WebdriverIO was its straightforward API and complete support for all browsers and devices we needed to test, compared to Cypress and Puppeteer which lack support for one or more of the necessary platforms. More importantly, though, was its rich plugin system and active, engaged developer community. Sponsorship from Sauce Labs, which had already made a name for itself within the testing space, gave us confidence that WebdriverIO would continue to grow and not become abandonware.

Out of the box, WebdriverIO had support for several of our existing and desired toolsets. Tools such as [Allure reporting](https://webdriver.io/docs/allure-reporter), which we use to quickly comb through product defects, as well as [Report Portal](https://webdriver.io/docs/wdio-reportportal-reporter), which we use to monitor test health and track trends over time, were easy for us to integrate. The granular [pre and post execution hooks](https://webdriver.io/docs/options/#hooks) gave the test engineers an unprecedented ability to shape how and where tests executed.

## Webdriver.IO Practical Approach

As more features keep being added to WebdriverIO, we are continually able to simplify our codebase by removing open source dependencies and messy mixin code. We have even been able to decommission services that our old framework relied on altogether.

- The [Network Primitives feature](https://webdriver.io/blog/2020/07/10/network-primitives), released last year, allowed us to remove our dependency on Browsermob Proxy, a proxy tool commonly used in Selenium Webdriver applications to intercept and manipulate HTTP requests. We now call `browser.mock()`, specify a substring or regex of the request we want to capture and supply a simple mock object to replace the asset. The ability to delay a response allowed us to automate several complicated tests which had required manual execution. We were then able to validate the player’s behavior when particular requests, such as ads, are delayed due to network or other external conditions:

    ```
    // mock.js
    export function delayResponse3seconds() {
        return new Promise((resolve) => setTimeout(() => {
            return resolve('{ "foo": bar }');
        }, 3000));
    }

    // test.js
    import { delayResponse3seconds } from './mock';

    function rewritePattern(pattern, replacement) {
       console.log(`Attempting to rewrite: ${pattern} with: ${replacement}`);
       const toRewrite = browser.mock(`**/${pattern}`);
       toRewrite.respond(delayResponse3seconds);
       console.log(`Successfully rewrote ${pattern} to ${replacement}`);
    }
    ```
- The [Chrome Devtools Protocol](https://webdriver.io/docs/api/chromium) support that comes out of the box has also enabled us to automate some tests that were a manual chore. Being able to call `browser.throttle(“Good3G”)` after our initial page load has allowed us to more accurately verify how the video player behaves under more real world conditions for our mobile users.

- Thanks to [WebdriverIO’s CDP mapping](https://webdriver.io/docs/devtools-service/#getmetrics), we have been able to create and maintain a suite of performance tests. Calling `browser.getMetrics()` after a page load and interacting with the player has enabled us to verify that once a player is set up and embedded onto a customer’s website, it will not cause any undue Cumulative Layout Shifts for the end user, which create a disruptive page loading experience.

## Summary

Overall, JW Player’s migration to WebdriverIO was nothing short of a huge success. Between the performance and “quality of life” improvements over our old framework, WebdriverIO’s feature set has allowed us to automate a couple of hundred manual test cases. We've been able to greatly cut down the length of our regression cycles from approximately 1 week to just a couple of days. Most importantly, however, these improvements have allowed us to find a record number of defects, leading to a better quality product and delivering more customer value.
