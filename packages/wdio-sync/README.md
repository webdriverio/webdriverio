WebdriverIO Sync
================

> A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously

A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously. It overwrites global functions depending on the test framework (e.g. for Mocha describe and it) and uses Fibers to make commands of WebdriverIO using the wdio testrunner synchronous. This package is consumed by all wdio framework adapters.
