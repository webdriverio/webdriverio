---
title: Grouping Specs for Execution in a Single Instance
author: Ross Addinall
authorURL: http://twitter.com/rossaddinall
authorImageURL: https://s.gravatar.com/avatar/340d9dcc2c732de725ea9d94bdfcfe82?s=80
---

Until now, WebdriverIO has created a separate instance to run each of the spec files. So, if we have a directory structure that looks something like this:

```
test
 └─── specs
         │  test_login.js
         │  test_product_order.js
         │  test_checkout.js
         │  test_b1.js
         │  test_b2.js
```
and the config file has specs defined as follows:

```json
    "specs": [
        './test/specs/test*.js'
    ],
```
then when WebdriverIO is run, the specs definition will be expanded to create a list of all the test files, and a separate instance will be created to run each test (up to the value of "maxInstances").  Remaining tests will be queued until tests complete.  Consequently, each test is run in its own instance.

This model has many advantages.  It means that tests can be run in parallel and makes it easier to retry tests that fail etc.

However, there are cases where this does not work so well.  In one case a users flow involved transpiling tens of thousands of Typescript files for each of the ~250 test files, resulting in a huge overhead in the speed of the testing.  In another case a remote device farm was provisioning a new device for each test with all the associated setup thereby impacting performance and cost.

At [Vertizan](https://www.vitaq.io) we are integrating our AI-driven and functional coverage-led Vitaq test automation tool with WebdriverIO and Mocha. For Vitaq AI to work, it needs to be able to select which test/action to run next and that requires having all of the tests available in a single instance.

Consequently, we have worked with the WebdriverIO team to implement a syntax which allows the user to specify which tests should be grouped together for execution in the same instance.  All of the three test execution frameworks (Mocha, Jasmine, Cucumber) are supported by this approach, and by default they will run the tests sequentially.

To take advantage of this capability, the definition of the specs in the WDIO config file has been extended so that it can now accept arrays within the specs array. All of the files within an inner array are grouped together and run in the same instance.

So, the following specs definition:

```json
    "specs": [
        [
            "./test/specs/test_login.js",
            "./test/specs/test_product_order.js",
            "./test/specs/test_checkout.js"
        ],
        "./test/specs/test_b*.js",
    ],
```
when run against the previously described directory tree would result in three instances:
- One instance would run the group of test_login.js, test_product_order.js and test_checkout.js
- Another instance would run test_b1.js
- A final instance would run test_b2.js

It is only the specs definition that supports this syntax.

**EDIT:**
This syntax has now been extended to support specs defined in suites, so you can now also define suites like this:
```json
    "suites": {
        end2end: [
            [
                "./test/specs/test_login.js",
                "./test/specs/test_product_order.js",
                "./test/specs/test_checkout.js"
            ]
        ],
        allb: ["./test/specs/test_b*.js"]
},
```
and in this case all of the tests of the "end2end" suite would be run in a single instance.
