---
id: environment
title: Environment Variables
---

WebdriverIO sets the following environment variables within every worker:

## `NODE_ENV`

Set to `'test'` if it's not already set to something else.

## `WDIO_WORKER_ID`

An unique id that helps identify the worker process. It has format of `{number}-{number}` where the first number identifies the capability and the second the spec file that capability is running, e.g. `0-5` indicates a worker the first running the 6th spec file for the first capability.
