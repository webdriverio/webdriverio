WebdriverIO Sync
================

> A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously

A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously. It overwrites global functions depending on the test framework (e.g. for Mocha describe and it) and uses [`deasync`](https://www.npmjs.com/package/deasync) to make commands of WebdriverIO using the wdio testrunner synchronous.
